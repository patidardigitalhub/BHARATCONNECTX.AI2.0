import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Worker, Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../common/whatsapp.service';
import { SegmentsService } from './segments.service';
import { CampaignJobData } from './campaign-queue.service';

@Injectable()
export class CampaignProcessor implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CampaignProcessor.name);
  private worker: Worker<CampaignJobData>;

  constructor(
    private readonly config: ConfigService,
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly segmentsService: SegmentsService,
  ) {}

  onModuleInit() {
    const url = this.config.get<string>('REDIS_URL') ?? 'redis://localhost:6379';
    const u = new URL(url);

    this.worker = new Worker<CampaignJobData>(
      'campaign-send',
      async (job: Job<CampaignJobData>) => this.processCampaign(job.data.campaignId),
      {
        connection: {
          host: u.hostname,
          port: Number(u.port || 6379),
          password: u.password || undefined,
          maxRetriesPerRequest: null,
        },
      },
    );

    this.worker.on('failed', (job, err) => {
      this.logger.error(`Campaign job ${job?.id} failed: ${err.message}`);
    });
  }

  private async processCampaign(campaignId: string) {
    const campaign = await this.prisma.campaign.findUnique({
      where: { id: campaignId },
      include: { template: true },
    });
    if (!campaign) {
      this.logger.warn(`Campaign ${campaignId} not found — skipping`);
      return;
    }

    await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'SENDING' } });

    const recipients = await this.segmentsService.resolveCustomers(campaign.segmentId);

    // Sequential on purpose: a real BSP enforces its own rate limit
    // (spec section 10 — "per-business rate limiting"), so this isn't
    // parallelized. For very large segments, BullMQ's own concurrency /
    // rate-limiter options are the place to tune throughput, not
    // Promise.all here.
    for (const customer of recipients) {
      const log = await this.prisma.deliveryLog.create({
        data: { campaignId, customerId: customer.id, status: 'QUEUED' },
      });

      try {
        await this.whatsapp.sendMessage(customer.phone, campaign.template.bodyText);
        await this.prisma.deliveryLog.update({
          where: { id: log.id },
          data: { status: 'SENT', sentAt: new Date() },
        });
        await this.prisma.interaction.create({
          data: {
            businessId: campaign.businessId,
            customerId: customer.id,
            channel: 'WHATSAPP',
            direction: 'OUTBOUND',
            payload: { text: campaign.template.bodyText, campaignId },
          },
        });
      } catch (e) {
        this.logger.error(`Failed to send to ${customer.phone}: ${(e as Error).message}`);
        await this.prisma.deliveryLog.update({ where: { id: log.id }, data: { status: 'FAILED' } });
      }
    }

    await this.prisma.campaign.update({ where: { id: campaignId }, data: { status: 'COMPLETED' } });
  }

  async onModuleDestroy() {
    await this.worker?.close();
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CampaignQueueService } from './campaign-queue.service';
import { CreateCampaignDto } from './dto/marketing.dto';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly queue: CampaignQueueService,
  ) {}

  async create(businessId: string, dto: CreateCampaignDto) {
    const segment = await this.prisma.segment.findFirst({ where: { id: dto.segmentId, businessId } });
    if (!segment) throw new NotFoundException('Segment not found');

    const template = await this.prisma.messageTemplate.findFirst({
      where: { id: dto.templateId, businessId },
    });
    if (!template) throw new NotFoundException('Message template not found');

    const scheduledAt = dto.scheduledAt ? new Date(dto.scheduledAt) : null;
    const campaign = await this.prisma.campaign.create({
      data: {
        businessId,
        segmentId: dto.segmentId,
        templateId: dto.templateId,
        scheduledAt,
        status: scheduledAt ? 'SCHEDULED' : 'DRAFT',
      },
    });

    const delayMs = scheduledAt ? Math.max(0, scheduledAt.getTime() - Date.now()) : 0;
    await this.queue.enqueue(campaign.id, delayMs);

    return campaign;
  }

  async getReport(businessId: string, campaignId: string) {
    const campaign = await this.prisma.campaign.findFirst({
      where: { id: campaignId, businessId },
      include: { deliveryLogs: true },
    });
    if (!campaign) throw new NotFoundException('Campaign not found');

    const counts: Record<string, number> = {};
    for (const log of campaign.deliveryLogs) {
      counts[log.status] = (counts[log.status] ?? 0) + 1;
    }

    return {
      campaignId: campaign.id,
      status: campaign.status,
      totalRecipients: campaign.deliveryLogs.length,
      breakdown: counts,
    };
  }
}

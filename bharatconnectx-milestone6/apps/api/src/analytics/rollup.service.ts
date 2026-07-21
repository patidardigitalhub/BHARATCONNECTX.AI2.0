import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RollupService {
  private readonly logger = new Logger(RollupService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Computes the rollup for a single calendar day across every
   * business and upserts it — safe to re-run for the same day (e.g.
   * a manual backfill), it just overwrites that day's numbers.
   */
  async runForDate(date: Date) {
    const dayStart = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
    const dayEnd = new Date(dayStart);
    dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);

    const businesses = await this.prisma.business.findMany({ select: { id: true } });

    for (const { id: businessId } of businesses) {
      const [
        newCustomers,
        appointmentsBooked,
        appointmentsCancelled,
        whatsappInbound,
        whatsappOutbound,
        campaignMessagesSent,
      ] = await Promise.all([
        this.prisma.customer.count({
          where: { businessId, createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.appointment.count({
          where: { createdAt: { gte: dayStart, lt: dayEnd }, slot: { service: { businessId } } },
        }),
        this.prisma.appointment.count({
          where: {
            status: 'CANCELLED',
            createdAt: { gte: dayStart, lt: dayEnd },
            slot: { service: { businessId } },
          },
        }),
        this.prisma.interaction.count({
          where: { businessId, channel: 'WHATSAPP', direction: 'INBOUND', createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.interaction.count({
          where: { businessId, channel: 'WHATSAPP', direction: 'OUTBOUND', createdAt: { gte: dayStart, lt: dayEnd } },
        }),
        this.prisma.deliveryLog.count({
          where: {
            status: { in: ['SENT', 'DELIVERED', 'READ'] },
            sentAt: { gte: dayStart, lt: dayEnd },
            campaign: { businessId },
          },
        }),
      ]);

      await this.prisma.analyticsDailyRollup.upsert({
        where: { businessId_date: { businessId, date: dayStart } },
        update: {
          newCustomers,
          appointmentsBooked,
          appointmentsCancelled,
          whatsappMessagesInbound: whatsappInbound,
          whatsappMessagesOutbound: whatsappOutbound,
          campaignMessagesSent,
          computedAt: new Date(),
        },
        create: {
          businessId,
          date: dayStart,
          newCustomers,
          appointmentsBooked,
          appointmentsCancelled,
          whatsappMessagesInbound: whatsappInbound,
          whatsappMessagesOutbound: whatsappOutbound,
          campaignMessagesSent,
        },
      });
    }

    this.logger.log(`Rollup complete for ${dayStart.toISOString().slice(0, 10)} — ${businesses.length} business(es)`);
  }

  /** Convenience for the nightly cron: always rolls up "yesterday" in UTC. */
  async runForYesterday() {
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    return this.runForDate(yesterday);
  }
}

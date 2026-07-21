import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getOverview(businessId: string, days = 30) {
    const since = new Date();
    since.setUTCDate(since.getUTCDate() - days);

    const rollups = await this.prisma.analyticsDailyRollup.findMany({
      where: { businessId, date: { gte: since } },
      orderBy: { date: 'asc' },
    });

    const totals = rollups.reduce(
      (acc, r) => ({
        newCustomers: acc.newCustomers + r.newCustomers,
        appointmentsBooked: acc.appointmentsBooked + r.appointmentsBooked,
        appointmentsCancelled: acc.appointmentsCancelled + r.appointmentsCancelled,
        whatsappMessagesInbound: acc.whatsappMessagesInbound + r.whatsappMessagesInbound,
        whatsappMessagesOutbound: acc.whatsappMessagesOutbound + r.whatsappMessagesOutbound,
        campaignMessagesSent: acc.campaignMessagesSent + r.campaignMessagesSent,
      }),
      {
        newCustomers: 0,
        appointmentsBooked: 0,
        appointmentsCancelled: 0,
        whatsappMessagesInbound: 0,
        whatsappMessagesOutbound: 0,
        campaignMessagesSent: 0,
      },
    );

    return {
      rangeDays: days,
      totals,
      daily: rollups.map((r) => ({
        date: r.date,
        newCustomers: r.newCustomers,
        appointmentsBooked: r.appointmentsBooked,
        appointmentsCancelled: r.appointmentsCancelled,
        whatsappMessagesInbound: r.whatsappMessagesInbound,
        whatsappMessagesOutbound: r.whatsappMessagesOutbound,
        campaignMessagesSent: r.campaignMessagesSent,
      })),
    };
  }
}

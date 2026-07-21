import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { WhatsappService } from '../common/whatsapp.service';
import { NotifyGateway } from './notify.gateway';
import { ServicesService } from '../booking/services.service';
import { InboundWhatsAppMessageDto } from './dto/inbound-message.dto';

type Intent = 'booking' | 'human' | 'general';

const BOOKING_KEYWORDS = ['book', 'appointment', 'slot', 'schedule'];
const HUMAN_KEYWORDS = ['agent', 'human', 'help', 'talk to someone', 'representative'];

@Injectable()
export class WebhooksService {
  private readonly logger = new Logger(WebhooksService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly whatsapp: WhatsappService,
    private readonly notifyGateway: NotifyGateway,
    private readonly servicesService: ServicesService,
  ) {}

  async handleInbound(dto: InboundWhatsAppMessageDto) {
    const business = await this.prisma.business.findUnique({
      where: { whatsappNumber: dto.toBusinessNumber },
    });
    if (!business) {
      throw new NotFoundException(
        `No business registered on WhatsApp number ${dto.toBusinessNumber}`,
      );
    }

    const customer = await this.prisma.customer.upsert({
      where: { businessId_phone: { businessId: business.id, phone: dto.fromCustomerNumber } },
      update: {},
      create: {
        businessId: business.id,
        phone: dto.fromCustomerNumber,
        source: 'whatsapp',
      },
    });

    await this.prisma.interaction.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        channel: 'WHATSAPP',
        direction: 'INBOUND',
        payload: { text: dto.text, messageId: dto.messageId ?? null },
      },
    });

    const intent = this.detectIntent(dto.text);
    const replyText = await this.routeByIntent(business.id, customer.id, intent, dto.text);

    await this.whatsapp.sendMessage(dto.fromCustomerNumber, replyText);

    await this.prisma.interaction.create({
      data: {
        businessId: business.id,
        customerId: customer.id,
        channel: 'WHATSAPP',
        direction: 'OUTBOUND',
        payload: { text: replyText, intent },
      },
    });

    return { businessId: business.id, customerId: customer.id, intent, replyText };
  }

  verifyChallenge(mode: string, token: string, challenge: string, expectedToken: string) {
    if (mode === 'subscribe' && token === expectedToken) {
      return challenge;
    }
    return null;
  }

  private detectIntent(text: string): Intent {
    const lower = text.toLowerCase();
    if (HUMAN_KEYWORDS.some((k) => lower.includes(k))) return 'human';
    if (BOOKING_KEYWORDS.some((k) => lower.includes(k))) return 'booking';
    return 'general';
  }

  private async routeByIntent(
    businessId: string,
    customerId: string,
    intent: Intent,
    text: string,
  ): Promise<string> {
    switch (intent) {
      case 'booking': {
        // MVP routing: offers the soonest open slot across the
        // business's first configured service. Real service-matching
        // from free text ("book a haircut" -> Haircut service) is a
        // Connect AI orchestrator job (Phase 2) — this keeps Milestone 4
        // testable without that NLU layer.
        const services = await this.servicesService.list(businessId);
        if (services.length === 0) {
          return "We don't have any bookable services set up yet — someone from the team will reach out.";
        }
        const slots = await this.servicesService.listAvailableSlots(businessId, services[0].id);
        if (slots.length === 0) {
          return `No open slots for ${services[0].name} right now — someone will follow up with options.`;
        }
        const next = slots[0];
        return `Next available ${services[0].name} slot: ${next.startTime.toLocaleString()}. Reply to confirm and we'll book it.`;
      }

      case 'human':
        this.notifyGateway.notifyHumanNeeded(businessId, { customerId, text });
        return "Connecting you with someone from the team — they'll reply here shortly.";

      case 'general':
      default:
        // TODO: hand off to the Connect AI orchestrator (Phase 2, Claude
        // API) for a real contextual answer using pgvector RAG per
        // business (FAQs/services/pricing) — spec section 2.
        return "Thanks for your message — someone will get back to you. (Connect AI orchestrator is Phase 2.)";
    }
  }
}

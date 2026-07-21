import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMessageTemplateDto } from './dto/marketing.dto';

@Injectable()
export class MessageTemplatesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    return this.prisma.messageTemplate.findMany({ where: { businessId } });
  }

  async create(businessId: string, dto: CreateMessageTemplateDto) {
    // NOTE: real templates need BSP/Meta approval before they can be
    // sent (spec section 4.3 — approval_status mirrors that state).
    // This creates it PENDING; approving it is a manual/BSP-side step
    // until that integration exists, so campaigns below don't block
    // on approval yet — that gate belongs here once the BSP is wired up.
    return this.prisma.messageTemplate.create({
      data: { businessId, name: dto.name, bodyText: dto.bodyText },
    });
  }
}

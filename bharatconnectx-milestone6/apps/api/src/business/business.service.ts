import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { OnboardBusinessDto } from './dto/onboard-business.dto';

@Injectable()
export class BusinessService {
  constructor(private readonly prisma: PrismaService) {}

  async onboard(dto: OnboardBusinessDto) {
    const existing = await this.prisma.business.findUnique({
      where: { whatsappNumber: dto.whatsappNumber },
    });
    if (existing) {
      throw new ConflictException('A business is already registered on this WhatsApp number');
    }

    // Business + its first OWNER user are created together in one
    // transaction — spec section 5.1 treats onboarding as a single step,
    // and auth/otp/verify requires a User row to already exist.
    const business = await this.prisma.$transaction(async (tx) => {
      const created = await tx.business.create({
        data: {
          name: dto.name,
          category: dto.category,
          whatsappNumber: dto.whatsappNumber,
          status: 'PENDING', // flips to ACTIVE once WhatsApp number verification completes
        },
      });

      await tx.user.create({
        data: {
          businessId: created.id,
          phone: dto.ownerPhone,
          role: 'OWNER',
        },
      });

      return created;
    });

    // TODO: trigger WhatsApp number verification with the BSP here
    // (spec section 5.1 — "trigger WhatsApp number verification").

    return {
      business,
      message: 'Business created. Verify OTP on the owner phone to log in.',
    };
  }

  async getEntryQr(businessId: string) {
    const business = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!business) throw new NotFoundException('Business not found');

    // Customer-facing entry point: scanning this opens a WhatsApp chat
    // pre-filled to this business's number (spec section 5.1).
    const waLink = `https://wa.me/${business.whatsappNumber.replace('+', '')}`;
    const qrDataUrl = await QRCode.toDataURL(waLink);

    return { businessId, waLink, qrDataUrl };
  }
}

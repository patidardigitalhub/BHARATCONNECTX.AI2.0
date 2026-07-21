import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { OtpStoreService } from '../common/otp-store.service';
import { WhatsappService } from '../common/whatsapp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly otpStore: OtpStoreService,
    private readonly whatsapp: WhatsappService,
    private readonly jwt: JwtService,
  ) {}

  async requestOtp(phone: string) {
    const code = this.otpStore.generate(phone);
    await this.whatsapp.sendOtp(phone, code);
    return { message: 'OTP sent', phone };
  }

  async verifyOtp(phone: string, otp: string) {
    const result = this.otpStore.verify(phone, otp);
    if (!result.valid) {
      throw new BadRequestException(result.reason ?? 'OTP verification failed');
    }

    // Find the dashboard user this phone belongs to. A phone with no
    // existing user has no business yet — send them through
    // POST /business/onboard first, which creates both records together.
    const user = await this.prisma.user.findFirst({
      where: { phone },
      include: { business: true },
    });

    if (!user) {
      throw new UnauthorizedException(
        'No business account found for this number — onboard a business first',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { otpVerifiedAt: new Date() },
    });

    const accessToken = this.jwt.sign({
      sub: user.id,
      businessId: user.businessId,
      role: user.role,
      phone: user.phone,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        phone: user.phone,
        role: user.role,
        businessId: user.businessId,
        businessName: user.business.name,
      },
    };
  }
}

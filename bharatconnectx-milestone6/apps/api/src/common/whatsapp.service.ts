import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Thin wrapper around the WhatsApp BSP (AiSensy / Interakt / Gupshup —
 * spec section 2 leaves the provider choice open). Everything else in
 * the app talks to `sendMessage`, never to the BSP's HTTP API directly,
 * so switching providers later is a one-file change.
 *
 * Right now this just logs — plug in real BSP credentials
 * (WHATSAPP_BSP_API_KEY in .env) and the provider's send-template
 * endpoint once an account is picked.
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);

  constructor(private readonly config: ConfigService) {}

  async sendMessage(phone: string, text: string): Promise<void> {
    const apiKey = this.config.get<string>('WHATSAPP_BSP_API_KEY');

    if (!apiKey) {
      this.logger.warn(`WHATSAPP_BSP_API_KEY not set — message to ${phone} logged instead of sent: "${text}"`);
      return;
    }

    // TODO: replace with real BSP call once a provider is chosen.
    this.logger.log(`[stub] Message to ${phone} would be sent via BSP: "${text}"`);
  }

  async sendOtp(phone: string, code: string): Promise<void> {
    const apiKey = this.config.get<string>('WHATSAPP_BSP_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        `WHATSAPP_BSP_API_KEY not set — OTP for ${phone} logged instead of sent: ${code}`,
      );
      return;
    }

    // TODO: replace with real BSP call once a provider is chosen, e.g.:
    // await fetch(`https://api.<bsp>.io/v1/messages`, {
    //   method: 'POST',
    //   headers: { Authorization: `Bearer ${apiKey}` },
    //   body: JSON.stringify({ to: phone, template: 'otp_login', params: [code] }),
    // });
    this.logger.log(`[stub] OTP ${code} would be sent to ${phone} via BSP`);
  }
}

import { Body, Controller, Get, Post, Query, Res } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { WebhooksService } from './webhooks.service';
import { InboundWhatsAppMessageDto } from './dto/inbound-message.dto';

@Controller('webhooks/whatsapp')
export class WebhooksController {
  constructor(
    private readonly webhooksService: WebhooksService,
    private readonly config: ConfigService,
  ) {}

  /**
   * Meta/BSP webhook verification challenge (spec section 5.5).
   * Called once when you register the webhook URL with the provider.
   */
  @Get()
  verify(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const expected = this.config.get<string>('WHATSAPP_WEBHOOK_VERIFY_TOKEN');
    const result = this.webhooksService.verifyChallenge(mode, token, challenge, expected ?? '');

    if (result === null) {
      return res.status(403).send('Verification failed');
    }
    return res.status(200).send(result);
  }

  /**
   * Inbound message/status webhook from the BSP (spec section 5.5 / 6).
   *
   * NOTE: real BSPs POST their own provider-specific envelope here, not
   * this normalized DTO directly — see the comment in
   * dto/inbound-message.dto.ts for where the adapter goes once a
   * provider is chosen.
   */
  @Post()
  handleInbound(@Body() dto: InboundWhatsAppMessageDto) {
    return this.webhooksService.handleInbound(dto);
  }
}

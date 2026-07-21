import { IsNotEmpty, IsString } from 'class-validator';

/**
 * NOTE — every BSP (AiSensy / Interakt / Gupshup) wraps the actual
 * message in its own JSON envelope, and they're all different. This
 * DTO is the *normalized* shape this app works with internally.
 *
 * Until a provider is chosen (spec section 2), `WebhooksController`
 * accepts this shape directly so the routing/logging logic below can
 * be built and tested now. When you pick a BSP, write one small
 * adapter function that converts *their* payload into this shape and
 * call `webhooksService.handleInbound()` with the result — nothing
 * else in this module needs to change.
 */
export class InboundWhatsAppMessageDto {
  @IsString()
  @IsNotEmpty()
  toBusinessNumber: string; // which business this WhatsApp number belongs to

  @IsString()
  @IsNotEmpty()
  fromCustomerNumber: string;

  @IsString()
  @IsNotEmpty()
  text: string;

  @IsString()
  messageId?: string;
}

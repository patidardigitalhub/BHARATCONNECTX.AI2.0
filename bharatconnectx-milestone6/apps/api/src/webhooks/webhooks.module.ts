import { Module } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import { WebhooksService } from './webhooks.service';
import { NotifyGateway } from './notify.gateway';
import { WhatsappService } from '../common/whatsapp.service';
import { BookingModule } from '../booking/booking.module';

@Module({
  imports: [BookingModule],
  controllers: [WebhooksController],
  providers: [WebhooksService, NotifyGateway, WhatsappService],
})
export class WebhooksModule {}

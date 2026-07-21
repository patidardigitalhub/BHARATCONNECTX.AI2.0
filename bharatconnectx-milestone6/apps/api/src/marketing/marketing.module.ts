import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { MessageTemplatesController } from './message-templates.controller';
import { MessageTemplatesService } from './message-templates.service';
import { CampaignsController } from './campaigns.controller';
import { CampaignsService } from './campaigns.service';
import { CampaignQueueService } from './campaign-queue.service';
import { CampaignProcessor } from './campaign.processor';
import { WhatsappService } from '../common/whatsapp.service';

@Module({
  imports: [AuthModule],
  controllers: [SegmentsController, MessageTemplatesController, CampaignsController],
  providers: [
    SegmentsService,
    MessageTemplatesService,
    CampaignsService,
    CampaignQueueService,
    CampaignProcessor,
    WhatsappService,
  ],
  exports: [SegmentsService],
})
export class MarketingModule {}

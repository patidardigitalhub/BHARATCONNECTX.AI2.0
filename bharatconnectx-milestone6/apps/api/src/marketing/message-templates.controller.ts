import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { MessageTemplatesService } from './message-templates.service';
import { CreateMessageTemplateDto } from './dto/marketing.dto';

@UseGuards(JwtAuthGuard)
@Controller('message-templates')
export class MessageTemplatesController {
  constructor(private readonly templatesService: MessageTemplatesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.templatesService.list(user.businessId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateMessageTemplateDto) {
    return this.templatesService.create(user.businessId, dto);
  }
}

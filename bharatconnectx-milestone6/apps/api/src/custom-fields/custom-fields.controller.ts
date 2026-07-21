import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';

@UseGuards(JwtAuthGuard)
@Controller('custom-fields')
export class CustomFieldsController {
  constructor(private readonly customFieldsService: CustomFieldsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.customFieldsService.list(user.businessId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomFieldDto) {
    return this.customFieldsService.create(user.businessId, dto);
  }
}

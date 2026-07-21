import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { SegmentsService } from './segments.service';
import { CreateSegmentDto } from './dto/marketing.dto';

@UseGuards(JwtAuthGuard)
@Controller('segments')
export class SegmentsController {
  constructor(private readonly segmentsService: SegmentsService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.segmentsService.list(user.businessId);
  }

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateSegmentDto) {
    return this.segmentsService.create(user.businessId, dto);
  }
}

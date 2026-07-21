import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { BusinessService } from './business.service';
import { OnboardBusinessDto } from './dto/onboard-business.dto';

@Controller('business')
export class BusinessController {
  constructor(private readonly businessService: BusinessService) {}

  @Post('onboard')
  onboard(@Body() dto: OnboardBusinessDto) {
    return this.businessService.onboard(dto);
  }

  @Get(':id/qr')
  getQr(@Param('id') id: string) {
    return this.businessService.getEntryQr(id);
  }
}

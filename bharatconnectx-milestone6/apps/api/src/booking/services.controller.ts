import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateSlotDto } from './dto/create-slot.dto';

@UseGuards(JwtAuthGuard)
@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  list(@CurrentUser() user: AuthUser) {
    return this.servicesService.list(user.businessId);
  }

  // Not in spec table 5.3 as written, but needed to actually create the
  // services that GET /services lists.
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(user.businessId, dto);
  }

  @Get(':id/slots')
  listSlots(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.servicesService.listAvailableSlots(user.businessId, id);
  }

  // Not in spec table 5.3 as written, but needed to actually generate
  // the slots GET /services/:id/slots reads.
  @Post(':id/slots')
  createSlot(@CurrentUser() user: AuthUser, @Param('id') id: string, @Body() dto: CreateSlotDto) {
    return this.servicesService.createSlot(user.businessId, id, dto);
  }
}

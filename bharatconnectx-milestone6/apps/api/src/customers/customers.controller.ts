import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthUser } from '../common/decorators/current-user.decorator';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, ListCustomersQueryDto, UpdateCustomerTagsDto } from './dto/customer.dto';

@UseGuards(JwtAuthGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListCustomersQueryDto) {
    return this.customersService.list(user.businessId, query);
  }

  @Get(':id')
  getOne(@CurrentUser() user: AuthUser, @Param('id') id: string) {
    return this.customersService.getOne(user.businessId, id);
  }

  // Not in spec table 5.2 as written, but needed until Milestone 3's
  // WhatsApp webhook exists to create customers automatically — lets
  // the dashboard add a walk-in/phone customer manually in the meantime.
  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(user.businessId, dto);
  }

  @Post(':id/tags')
  updateTags(
    @CurrentUser() user: AuthUser,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerTagsDto,
  ) {
    return this.customersService.updateTags(user.businessId, id, dto);
  }
}

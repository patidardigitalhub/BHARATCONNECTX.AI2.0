import { Module } from '@nestjs/common';
import { ServicesController } from './services.controller';
import { ServicesService } from './services.service';
import { AppointmentsController } from './appointments.controller';
import { AppointmentsService } from './appointments.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [AuthModule],
  controllers: [ServicesController, AppointmentsController],
  providers: [ServicesService, AppointmentsService],
  exports: [AppointmentsService, ServicesService],
})
export class BookingModule {}

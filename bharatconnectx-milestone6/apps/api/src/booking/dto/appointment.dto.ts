import { IsEnum, IsIn, IsNotEmpty, IsOptional, IsString, Matches } from 'class-validator';

export class CreateAppointmentDto {
  @IsString()
  @IsNotEmpty()
  slotId: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'customerPhone must be a valid E.164-style number' })
  customerPhone: string;

  @IsOptional()
  @IsString()
  customerName?: string;

  @IsOptional()
  @IsIn(['whatsapp', 'dashboard'])
  createdVia?: 'whatsapp' | 'dashboard';
}

export class UpdateAppointmentDto {
  // Cancel: pass action "cancel".
  // Reschedule: pass action "reschedule" + newSlotId.
  @IsIn(['cancel', 'reschedule'])
  action: 'cancel' | 'reschedule';

  @IsOptional()
  @IsString()
  newSlotId?: string;
}

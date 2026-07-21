import { IsISO8601, IsNotEmpty, IsString } from 'class-validator';

export class CreateSlotDto {
  @IsISO8601()
  @IsNotEmpty()
  startTime: string;

  @IsISO8601()
  @IsNotEmpty()
  endTime: string;
}

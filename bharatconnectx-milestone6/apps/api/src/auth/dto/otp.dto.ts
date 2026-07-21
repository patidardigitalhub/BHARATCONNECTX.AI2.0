import { IsNotEmpty, IsString, Matches, Length } from 'class-validator';

export class RequestOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'phone must be a valid E.164-style number' })
  phone: string;
}

export class VerifyOtpDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'phone must be a valid E.164-style number' })
  phone: string;

  @IsString()
  @Length(6, 6, { message: 'otp must be a 6-digit code' })
  otp: string;
}

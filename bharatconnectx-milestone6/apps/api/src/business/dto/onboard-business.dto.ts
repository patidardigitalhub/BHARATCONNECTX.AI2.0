import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class OnboardBusinessDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'whatsappNumber must be a valid E.164-style number' })
  whatsappNumber: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'ownerPhone must be a valid E.164-style number' })
  ownerPhone: string;
}

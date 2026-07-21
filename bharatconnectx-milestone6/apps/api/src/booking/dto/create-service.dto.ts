import { IsInt, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsInt()
  @Min(5)
  durationMin: number;

  @IsNumber()
  @Min(0)
  price: number;
}

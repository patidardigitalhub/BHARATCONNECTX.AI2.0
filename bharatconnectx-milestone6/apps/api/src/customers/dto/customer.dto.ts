import { IsArray, IsIn, IsOptional, IsString, Matches } from 'class-validator';
import { Type } from 'class-transformer';

export class ListCustomersQueryDto {
  @IsOptional()
  @IsString()
  tag?: string; // filter by tag name

  @IsOptional()
  @IsString()
  from?: string; // ISO date — created_at >= from

  @IsOptional()
  @IsString()
  to?: string; // ISO date — created_at <= to

  @IsOptional()
  @IsString()
  search?: string; // matches name or phone
}

export class CreateCustomerDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsString()
  @Matches(/^\+?[1-9]\d{9,14}$/, { message: 'phone must be a valid E.164-style number' })
  phone: string;

  @IsOptional()
  @IsString()
  source?: string;
}

export class UpdateCustomerTagsDto {
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  add: string[] = [];

  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  remove: string[] = [];
}

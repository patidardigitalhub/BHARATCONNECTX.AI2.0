import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export enum CustomFieldTypeDto {
  TEXT = 'TEXT',
  NUMBER = 'NUMBER',
  DATE = 'DATE',
  BOOLEAN = 'BOOLEAN',
  SELECT = 'SELECT',
}

export class CreateCustomFieldDto {
  @IsString()
  @IsNotEmpty()
  fieldName: string;

  @IsEnum(CustomFieldTypeDto)
  fieldType: CustomFieldTypeDto;
}

import { IsISO8601, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateSegmentDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  tagId: string;
}

export class CreateMessageTemplateDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  bodyText: string;
}

export class CreateCampaignDto {
  @IsString()
  @IsNotEmpty()
  segmentId: string;

  @IsString()
  @IsNotEmpty()
  templateId: string;

  @IsOptional()
  @IsISO8601()
  scheduledAt?: string; // omit to send immediately
}

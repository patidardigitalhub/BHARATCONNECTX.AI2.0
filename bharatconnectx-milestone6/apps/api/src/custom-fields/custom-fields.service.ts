import { ConflictException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';

@Injectable()
export class CustomFieldsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    return this.prisma.customField.findMany({ where: { businessId } });
  }

  async create(businessId: string, dto: CreateCustomFieldDto) {
    const existing = await this.prisma.customField.findUnique({
      where: { businessId_fieldName: { businessId, fieldName: dto.fieldName } },
    });
    if (existing) throw new ConflictException('A field with this name already exists');

    return this.prisma.customField.create({
      data: { businessId, fieldName: dto.fieldName, fieldType: dto.fieldType },
    });
  }
}

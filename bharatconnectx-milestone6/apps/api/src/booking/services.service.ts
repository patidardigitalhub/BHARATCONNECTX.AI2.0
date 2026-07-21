import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { CreateSlotDto } from './dto/create-slot.dto';

@Injectable()
export class ServicesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    return this.prisma.service.findMany({ where: { businessId }, orderBy: { name: 'asc' } });
  }

  async create(businessId: string, dto: CreateServiceDto) {
    return this.prisma.service.create({
      data: { businessId, name: dto.name, durationMin: dto.durationMin, price: dto.price },
    });
  }

  async listAvailableSlots(businessId: string, serviceId: string) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, businessId } });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.slot.findMany({
      where: {
        serviceId,
        startTime: { gte: new Date() },
        appointment: null, // never booked
      },
      orderBy: { startTime: 'asc' },
    });
  }

  async createSlot(businessId: string, serviceId: string, dto: CreateSlotDto) {
    const service = await this.prisma.service.findFirst({ where: { id: serviceId, businessId } });
    if (!service) throw new NotFoundException('Service not found');

    return this.prisma.slot.create({
      data: { serviceId, startTime: new Date(dto.startTime), endTime: new Date(dto.endTime) },
    });
  }
}

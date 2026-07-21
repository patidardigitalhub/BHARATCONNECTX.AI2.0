import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSegmentDto } from './dto/marketing.dto';

@Injectable()
export class SegmentsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string) {
    return this.prisma.segment.findMany({ where: { businessId }, include: { tag: true } });
  }

  async create(businessId: string, dto: CreateSegmentDto) {
    const tag = await this.prisma.tag.findFirst({ where: { id: dto.tagId, businessId } });
    if (!tag) throw new NotFoundException('Tag not found for this business');

    return this.prisma.segment.create({
      data: { businessId, name: dto.name, tagId: dto.tagId },
      include: { tag: true },
    });
  }

  /** Resolves a segment to the customers currently carrying its tag. */
  async resolveCustomers(segmentId: string) {
    const segment = await this.prisma.segment.findUnique({ where: { id: segmentId } });
    if (!segment) throw new NotFoundException('Segment not found');

    return this.prisma.customer.findMany({
      where: { businessId: segment.businessId, tags: { some: { tagId: segment.tagId } } },
    });
  }
}

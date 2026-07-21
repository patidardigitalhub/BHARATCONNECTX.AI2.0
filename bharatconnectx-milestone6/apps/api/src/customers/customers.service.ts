import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto, ListCustomersQueryDto, UpdateCustomerTagsDto } from './dto/customer.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async list(businessId: string, query: ListCustomersQueryDto) {
    const where: any = { businessId };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    if (query.from || query.to) {
      where.createdAt = {};
      if (query.from) where.createdAt.gte = new Date(query.from);
      if (query.to) where.createdAt.lte = new Date(query.to);
    }

    if (query.tag) {
      where.tags = { some: { tag: { name: query.tag } } };
    }

    const customers = await this.prisma.customer.findMany({
      where,
      include: { tags: { include: { tag: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return customers.map(this.serialize);
  }

  async getOne(businessId: string, customerId: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, businessId },
      include: {
        tags: { include: { tag: true } },
        interactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    return {
      ...this.serialize(customer),
      interactions: customer.interactions.map((i) => ({
        id: i.id,
        channel: i.channel,
        direction: i.direction,
        payload: i.payload,
        createdAt: i.createdAt,
      })),
    };
  }

  async create(businessId: string, dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { businessId_phone: { businessId, phone: dto.phone } },
    });
    if (existing) throw new ConflictException('A customer with this phone already exists');

    const customer = await this.prisma.customer.create({
      data: { businessId, name: dto.name, phone: dto.phone, source: dto.source ?? 'dashboard' },
      include: { tags: { include: { tag: true } } },
    });
    return this.serialize(customer);
  }

  async updateTags(businessId: string, customerId: string, dto: UpdateCustomerTagsDto) {
    const customer = await this.prisma.customer.findFirst({ where: { id: customerId, businessId } });
    if (!customer) throw new NotFoundException('Customer not found');

    if (dto.add.length) {
      for (const tagName of dto.add) {
        const tag = await this.prisma.tag.upsert({
          where: { businessId_name: { businessId, name: tagName } },
          update: {},
          create: { businessId, name: tagName },
        });
        await this.prisma.customerTag.upsert({
          where: { customerId_tagId: { customerId, tagId: tag.id } },
          update: {},
          create: { customerId, tagId: tag.id },
        });
      }
    }

    if (dto.remove.length) {
      const tags = await this.prisma.tag.findMany({
        where: { businessId, name: { in: dto.remove } },
      });
      await this.prisma.customerTag.deleteMany({
        where: { customerId, tagId: { in: tags.map((t) => t.id) } },
      });
    }

    const updated = await this.prisma.customer.findUnique({
      where: { id: customerId },
      include: { tags: { include: { tag: true } } },
    });
    return this.serialize(updated!);
  }

  private serialize(customer: any) {
    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      source: customer.source,
      createdAt: customer.createdAt,
      tags: customer.tags?.map((t: any) => t.tag.name) ?? [],
    };
  }
}

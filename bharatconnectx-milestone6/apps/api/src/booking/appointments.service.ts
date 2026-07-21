import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisLockService } from '../redis/redis-lock.service';
import { CreateAppointmentDto, UpdateAppointmentDto } from './dto/appointment.dto';

@Injectable()
export class AppointmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lock: RedisLockService,
  ) {}

  /**
   * Spec section 5.3: "Create appointment (locks slot in Redis first)".
   *
   * Order of operations matters here:
   *  1. Acquire the Redis lock FIRST — this is what closes the race
   *     between two customers booking the same slot at the same
   *     instant. Whoever loses the lock never even reaches the DB.
   *  2. Re-check the slot is actually still free inside the lock — a
   *     lock alone doesn't guarantee correctness if the slot was
   *     already booked earlier through a different path.
   *  3. The Appointment.slotId unique constraint is the last line of
   *     defense in case of a lock/DB inconsistency — belt and
   *     suspenders, not the primary mechanism.
   */
  async create(businessId: string, dto: CreateAppointmentDto) {
    const slot = await this.prisma.slot.findFirst({
      where: { id: dto.slotId, service: { businessId } },
      include: { service: true, appointment: true },
    });
    if (!slot) throw new NotFoundException('Slot not found');
    if (slot.appointment) throw new ConflictException('This slot is already booked');

    const lockToken = await this.lock.acquire(slot.id);
    if (!lockToken) {
      throw new ConflictException('This slot is currently being booked by someone else — try another');
    }

    try {
      // Re-check inside the lock — another request may have booked
      // this slot between our first check above and acquiring the lock.
      const fresh = await this.prisma.slot.findUnique({
        where: { id: slot.id },
        include: { appointment: true },
      });
      if (fresh?.appointment) {
        throw new ConflictException('This slot is already booked');
      }

      const customer = await this.prisma.customer.upsert({
        where: { businessId_phone: { businessId, phone: dto.customerPhone } },
        update: {},
        create: { businessId, phone: dto.customerPhone, name: dto.customerName, source: dto.createdVia ?? 'dashboard' },
      });

      try {
        const appointment = await this.prisma.$transaction(async (tx) => {
          const created = await tx.appointment.create({
            data: {
              customerId: customer.id,
              slotId: slot.id,
              createdVia: (dto.createdVia ?? 'dashboard').toUpperCase() as 'WHATSAPP' | 'DASHBOARD',
            },
          });
          await tx.slot.update({ where: { id: slot.id }, data: { isLocked: true } });
          return created;
        });
        return appointment;
      } catch (e) {
        // Checking e.code directly (not `instanceof Prisma.PrismaClientKnownRequestError`)
        // so this doesn't depend on that class being exported from the
        // generated client — works the same either way, and is one less
        // thing tied to how the client happens to be built.
        if (e && typeof e === 'object' && 'code' in e && (e as { code: unknown }).code === 'P2002') {
          throw new ConflictException('This slot is already booked');
        }
        throw e;
      }
    } finally {
      // Always release, whether we succeeded or hit a conflict —
      // otherwise a failed booking would leave the slot locked out
      // for other customers until the TTL expires.
      await this.lock.release(slot.id, lockToken);
    }
  }

  async update(businessId: string, appointmentId: string, dto: UpdateAppointmentDto) {
    const appointment = await this.prisma.appointment.findFirst({
      where: { id: appointmentId, slot: { service: { businessId } } },
      include: { slot: true },
    });
    if (!appointment) throw new NotFoundException('Appointment not found');

    if (dto.action === 'cancel') {
      return this.prisma.appointment.update({
        where: { id: appointmentId },
        data: { status: 'CANCELLED' },
      });
    }

    // reschedule: cancel this appointment, then book the new slot as a
    // fresh appointment for the same customer (keeps the old row as
    // history instead of mutating slotId, which is a unique column).
    if (!dto.newSlotId) throw new ConflictException('newSlotId is required to reschedule');

    const customer = await this.prisma.customer.findUnique({ where: { id: appointment.customerId } });
    if (!customer) throw new NotFoundException('Customer for this appointment no longer exists');

    await this.prisma.appointment.update({ where: { id: appointmentId }, data: { status: 'CANCELLED' } });

    // create() runs its own Redis lock + transaction for the new slot —
    // reschedule is "cancel old, book new", not one atomic DB transaction,
    // since the new slot needs its own independent lock/availability check.
    return this.create(businessId, { slotId: dto.newSlotId, customerPhone: customer.phone });
  }
}

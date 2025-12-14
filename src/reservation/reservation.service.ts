import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';
import { ReservationStatus as PrismaReservationStatus } from '@prisma/client'; 

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  // Crear reserva
  async create(dto: CreateReservationDto, userId: string) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) throw new BadRequestException('Fecha inválida');
    if (!dto.partySize || dto.partySize <= 0) throw new BadRequestException('Cantidad de personas inválida');

    return this.prisma.reservation.create({
      data: {
        date,
        partySize: dto.partySize,
        status: PrismaReservationStatus.PENDING,
        user: { connect: { id: userId } },
        restaurant: { connect: { id: dto.restaurantId } },
      },
      include: { user: true, restaurant: true },
    });
  }

  // Obtener todas las reservas
  async findAll() {
    const res = await this.prisma.reservation.findMany({
      include: { user: true, restaurant: true },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }

  async findAllByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true, user: true },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { user: true, restaurant: true },
    });
    if (!reservation) throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    return { ...reservation, people: reservation.partySize };
  }

  async findPendingByAdmin(adminId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { adminId } });
    if (restaurants.length === 0) return [];
    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: { status: PrismaReservationStatus.PENDING, restaurantId: { in: restaurantIds } },
      include: { user: true, restaurant: true },
    });
    return reservations.map(r => ({ ...r, people: r.partySize }));
  }

  async findByUserAndStatus(userId: string, status: PrismaReservationStatus) {
    const res = await this.prisma.reservation.findMany({
      where: { userId, status },
      include: { restaurant: true, user: true },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }

  async findByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true, user: true },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }

  async findAcceptedByAdmin(adminId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { adminId } });
    if (restaurants.length === 0) return [];
    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: { status: PrismaReservationStatus.ACCEPTED, restaurantId: { in: restaurantIds } },
      include: { user: true, restaurant: true },
    });
    return reservations.map(r => ({ ...r, people: r.partySize }));
  }

  async findCancelledByAdmin(adminId: string, limit?: number) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { adminId } });
    if (restaurants.length === 0) return [];
    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: { status: PrismaReservationStatus.CANCELLED, restaurantId: { in: restaurantIds } },
      include: { user: true, restaurant: true },
      orderBy: { date: "desc" },
      take: limit || undefined,
    });

    return reservations.map(r => ({ ...r, people: r.partySize }));
  }

  async addException(reservationId: string, adminId: string, message: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { exceptionDescription: message },
    });
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  async updateStatus(id: string, status: PrismaReservationStatus) {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reserva no encontrada');
    if (existing.status !== PrismaReservationStatus.PENDING) throw new BadRequestException('La reserva ya fue procesada');

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: { user: true, restaurant: true },
    });
    return { ...updated, people: updated.partySize };
  }

  async cancel(id: string, reason: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    if (reservation.status !== PrismaReservationStatus.ACCEPTED)
      throw new BadRequestException('Solo se pueden cancelar reservas aceptadas');

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: PrismaReservationStatus.CANCELLED, cancelReason: reason },
      include: { user: true, restaurant: true },
    });

    return { ...updated, people: updated.partySize };
  }

  async cancelByUser(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException("Reserva no encontrada");
    if (
      reservation.status !== PrismaReservationStatus.PENDING &&
      reservation.status !== PrismaReservationStatus.ACCEPTED
    ) {
      throw new BadRequestException("Solo se pueden cancelar reservas pendientes o aceptadas por el usuario");
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: PrismaReservationStatus.CANCELLED },
      include: { user: true, restaurant: true },
    });

    return { ...updated, people: updated.partySize };
  }

  async remove(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.delete({ where: { id } });
  }

  // Marcar reserva como completada o no (solo admin)
  async markAsCompleted(id: string, completed: boolean) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException("Reserva no encontrada");

    // Si completed = true → status = COMPLETED
    // Si completed = false → vuelve a ACCEPTED (mantiene el flujo)
    const newStatus = completed
      ? PrismaReservationStatus.COMPLETED
      : PrismaReservationStatus.ACCEPTED;

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        completed,
        status: newStatus,
      },
      include: { user: true, restaurant: true },
    });

    return { ...updated, people: updated.partySize };
  }


  // Buscar reservas por estado de completado
  async findByCompletion(completed: boolean) {
    const res = await this.prisma.reservation.findMany({
      where: { completed },
      include: { user: true, restaurant: true },
      orderBy: { date: 'desc' },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }

  // NUEVO: Obtener reservas completadas por usuario (para gráficos)
  async findCompletedByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId, completed: true },
      include: { restaurant: true, user: true },
      orderBy: { date: 'desc' },
    });
    return res.map(r => ({ ...r, people: r.partySize }));
  }
}

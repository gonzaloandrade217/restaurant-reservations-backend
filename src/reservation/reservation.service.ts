import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

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
        status: 'PENDING',
        user: { connect: { id: userId } },
        restaurant: { connect: { id: dto.restaurantId } },
      },
      include: {
        user: true,
        restaurant: true,
      },
    });
  }

  // Obtener todas las reservas
  async findAll() {
    const res = await this.prisma.reservation.findMany({
      include: { user: true, restaurant: true },
    });

    return res.map(r => ({ ...r, people: r.partySize }));
  }

  // Obtener reservas de un usuario
  async findAllByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true, user: true },
    });

    return res.map(r => ({ ...r, people: r.partySize }));
  }

  // Obtener una reserva por ID
  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { user: true, restaurant: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reserva con ID ${id} no encontrada`);
    }

    return { ...reservation, people: reservation.partySize };
  }

  // Reservas pendientes para los restaurantes de un admin
  async findPendingByAdmin(adminId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { adminId } });
    if (restaurants.length === 0) return [];

    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        restaurantId: { in: restaurantIds },
      },
      include: { user: true, restaurant: true },
    });

    return reservations.map(r => ({ ...r, people: r.partySize }));
  }

  // Reservas de un usuario según estado
  async findByUserAndStatus(userId: string, status: 'ACCEPTED' | 'REJECTED') {
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

  // Reservas aceptadas por admin
  async findAcceptedByAdmin(adminId: string) {
    const restaurants = await this.prisma.restaurant.findMany({ where: { adminId } });
    if (restaurants.length === 0) return [];

    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: { status: 'ACCEPTED', restaurantId: { in: restaurantIds } },
      include: { user: true, restaurant: true },
    });

    return reservations.map(r => ({ ...r, people: r.partySize }));
  }

  // Agregar excepción (mensaje del admin)
  async addException(reservationId: string, adminId: string, message: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    // Acá se podría agregar lógica para validar la excepción según capacidad, mesas, etc.
    return this.prisma.reservation.update({
      where: { id: reservationId },
      data: { exceptionDescription: message },
    });
  }

  // Actualizar reserva
  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  // Cambiar estado (aceptar/rechazar)
  async updateStatus(id: string, status: 'ACCEPTED' | 'REJECTED') {
    const existing = await this.prisma.reservation.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Reserva no encontrada');
    if (existing.status !== 'PENDING') throw new BadRequestException('La reserva ya fue procesada');

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: { user: true, restaurant: true },
    });

    return { ...updated, people: updated.partySize };
  }

  async cancel(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) throw new NotFoundException('Reserva no encontrada');
    if (reservation.status !== 'ACCEPTED') {
      throw new Error('Solo se pueden cancelar reservas aceptadas');
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: { user: true, restaurant: true },
    });

    return { ...updated, people: updated.partySize };
  }

  // Eliminar reserva
  async remove(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) throw new NotFoundException('Reserva no encontrada');

    return this.prisma.reservation.delete({ where: { id } });
  }
}

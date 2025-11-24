import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { UpdateReservationDto } from './dto/update-reservation.dto';

@Injectable()
export class ReservationService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateReservationDto, userId: string) {
    const date = new Date(dto.date);
    if (isNaN(date.getTime())) throw new Error('Fecha inválida');

    const data: any = {
      date,
      partySize: dto.partySize,
      status: 'PENDING',
      user: { connect: { id: userId } },
      restaurant: { connect: { id: dto.restaurantId } },
    };

    if (dto.tableId) {
      data.table = { connect: { id: dto.tableId } };
    }

    return this.prisma.reservation.create({
      data,
      include: {
        user: true,
        restaurant: true,
        table: true,
      },
    });
  }

  async findAll() {
    const res = await this.prisma.reservation.findMany({
      include: { user: true, restaurant: true, table: true },
    });

    return res.map(r => ({
      ...r,
      people: r.partySize,
    }));
  }

  async findAllByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true, user: true, table: true },
    });

    return res.map(r => ({
      ...r,
      people: r.partySize,
    }));
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
      include: { user: true, restaurant: true, table: true },
    });

    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }

    return {
      ...reservation,
      people: reservation.partySize,
    };
  }

  async findPendingByAdmin(adminId: string) {
    console.log(" ADMIN ID recibido:", adminId);

    const restaurants = await this.prisma.restaurant.findMany({
      where: { adminId },
    });

    console.log(" Restaurantes del admin:", restaurants.map(r => r.name));

    if (restaurants.length === 0) return [];

    const restaurantIds = restaurants.map(r => r.id);

    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'PENDING',
        restaurantId: { in: restaurantIds },
      },
      include: {
        user: true,
        restaurant: true,
        table: true,
      },
    });

    console.log(" Reservas pendientes encontradas:", reservations.length);

    const results = await Promise.all(
      reservations.map(async (res) => {
        const availableCapacity = await this.getAvailableCapacity(
          res.restaurantId,
          res.date,
        );

        return {
          ...res,
          people: res.partySize,
          availableCapacity,
          restaurantName: res.restaurant?.name || 'Desconocido',
          restaurantCapacity: res.restaurant?.capacity || 0,
        };
      }),
    );

    return results;
  }

  async findByUserAndStatus(userId: string, status: "ACCEPTED" | "REJECTED") {
    const res = await this.prisma.reservation.findMany({
      where: { userId, status },
      include: { restaurant: true, user: true, table: true },
    });

    return res.map(r => ({
      ...r,
      people: r.partySize,
    }));
  }

  async findByUser(userId: string) {
    const res = await this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true, user: true, table: true },
    });

    return res.map(r => ({
      ...r,
      people: r.partySize,
    }));
  }

  async findAcceptedByAdmin(adminId: string) {
    // 1. Traigo los restaurantes del admin
    const restaurants = await this.prisma.restaurant.findMany({
      where: { adminId },
    });

    if (restaurants.length === 0) return [];

    const restaurantIds = restaurants.map(r => r.id);

    // 2. Traigo reservas ACCEPTED de esos restaurantes
    const reservations = await this.prisma.reservation.findMany({
      where: {
        status: 'ACCEPTED',
        restaurantId: { in: restaurantIds },
      },
      include: {
        user: true,
        restaurant: true,
        table: true,
      },
    });

    return reservations.map(r => ({
      ...r,
      people: r.partySize,
    }));
  }


  async getAvailableCapacity(restaurantId: string, date: Date) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) return 0;

    const accepted = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        date,
        status: 'ACCEPTED',
      },
    });

    const usedCapacity = accepted.reduce((sum, r) => sum + r.partySize, 0);

    return restaurant.capacity - usedCapacity;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  private async assignTableOrCombine(restaurantId: string, partySize: number) {
    const tables = await this.prisma.table.findMany({
      where: { restaurantId },
      orderBy: { capacity: 'asc' },
    });

    // Caso 1: NO hay mesas -> usar capacidad total como 1 mesa gigante 
    if (tables.length === 0) {
      return null; 
    }

    // Caso 2: Hay una sola mesa suficiente 
    const single = tables.find(t => t.capacity >= partySize);
    if (single) return single;

    // Caso 3: Intentar juntar mesas 
    let sum = 0;
    for (const t of tables) {
      sum += t.capacity;
      if (sum >= partySize) {
        return t; // devuelve la última mesa usada
      }
    }

    return null; // ni juntas alcanzan
  }

  async updateStatus(id: string, status: 'ACCEPTED' | 'REJECTED') {
    const reservation = await this.prisma.reservation.findUnique({
      where: { id },
    });

    if (!reservation) {
      throw new Error('Reserva no encontrada');
    }

    if (reservation.status !== 'PENDING') {
      throw new Error('La reserva ya fue procesada');
    }

    if (status === 'ACCEPTED') {
      const assigned = await this.assignTableOrCombine(
        reservation.restaurantId,
        reservation.partySize
      );

      if (!assigned) {
        // Si no hay mesas pero sí capacidad total → aceptar igual sin tableId
        const restaurant = await this.prisma.restaurant.findUnique({
          where: { id: reservation.restaurantId },
        });

        if (restaurant && restaurant.capacity >= reservation.partySize) {
          const updated = await this.prisma.reservation.update({
            where: { id },
            data: { status, tableId: null },
            include: { user: true, restaurant: true, table: true },
          });

          return { ...updated, people: updated.partySize };
        }

        throw new Error('No hay mesas suficientes para esta reserva');
      }

      const updated = await this.prisma.reservation.update({
        where: { id },
        data: {
          status,
          tableId: assigned.id ?? null,
        },
        include: { user: true, restaurant: true, table: true },
      });

      return { ...updated, people: updated.partySize };
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status },
      include: { user: true, restaurant: true, table: true },
    });

    return { ...updated, people: updated.partySize };
  }

  async remove(id: string) {
    return this.prisma.reservation.delete({ where: { id } });
  }
}

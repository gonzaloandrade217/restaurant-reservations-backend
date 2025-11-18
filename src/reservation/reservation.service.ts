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

    // mapear partySize -> people para concordar con el frontend
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

  // Trae todas las reservas pendientes de los restaurantes de un admin
  async findPendingByAdmin(adminId: string) {
    console.log(" ADMIN ID recibido:", adminId);

    // Buscar restaurantes del admin
    const restaurants = await this.prisma.restaurant.findMany({
      where: { adminId },
    });

    console.log(" Restaurantes del admin:", restaurants.map(r => r.name));

    if (restaurants.length === 0) {
      console.log(" El admin no tiene restaurantes asignados");
      return [];
    }

    const restaurantIds = restaurants.map(r => r.id);

    // Buscar reservas pendientes de esos restaurantes
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

    // Calcular capacidad disponible para cada reserva
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
      include: {
        restaurant: true,
        user: true,
        table: true,
      },
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

  // Calcula la capacidad disponible para una fecha en un restaurante
  async getAvailableCapacity(restaurantId: string, date: Date) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
    });

    if (!restaurant) {
      console.warn(` Restaurante con ID ${restaurantId} no encontrado`);
      return 0;
    }

    const acceptedReservations = await this.prisma.reservation.findMany({
      where: {
        restaurantId,
        date,
        status: 'ACCEPTED',
      },
    });

    const usedCapacity = acceptedReservations.reduce(
      (sum, r) => sum + r.partySize,
      0,
    );

    return restaurant.capacity - usedCapacity;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    return this.prisma.reservation.update({
      where: { id },
      data: updateReservationDto,
    });
  }

  // Cambiar estado de reserva (aceptar/rechazar)
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

    // Si se acepta, asignar mesa automáticamente
    if (status === 'ACCEPTED') {
      const table = await this.prisma.table.findFirst({
        where: {
          restaurantId: reservation.restaurantId,
          capacity: { gte: reservation.partySize },
        },
        orderBy: { capacity: 'asc' },
      });

      if (!table) {
        throw new Error('No hay mesas disponibles para esta reserva');
      }

      const updated = await this.prisma.reservation.update({
        where: { id },
        data: {
          status,
          tableId: table.id,
        },
        include: { user: true, restaurant: true, table: true },
      });

      return { ...updated, people: updated.partySize };
    }

    // Si se rechaza
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

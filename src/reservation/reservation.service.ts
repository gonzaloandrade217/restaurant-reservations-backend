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

  findAll() {
    return this.prisma.reservation.findMany({
      include: { user: true, restaurant: true },
    });
  }

  async findAllByUser(userId: string) {
    return this.prisma.reservation.findMany({
      where: { userId },
      include: { restaurant: true },
    });
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findUnique({ where: { id } });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    return this.prisma.reservation.update({ where: { id }, data: updateReservationDto });
  }

  async remove(id: string) {
    return this.prisma.reservation.delete({ where: { id } });
  }
}

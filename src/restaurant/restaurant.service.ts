import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { MesaTipo } from '@prisma/client';
import { getStartOfDayUTC } from '../common/utils/date.utils';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  // CREAR RESTAURANTE
  async create(createRestaurantDto: CreateRestaurantDto, adminId: string) {
    const {
      name,
      address,
      phone,
      mesaTipo,
      mesaCapacidad,
      cantidadMesas,
      capacity,
      description,
      city,
      latitude,
      longitude,
    images,
    } = createRestaurantDto;

    // Validaciones básicas
    if (!name || !address || !phone || !city) {
      throw new BadRequestException(
        'Nombre, dirección, ciudad y teléfono son obligatorios'
      );
    }
    if (!mesaCapacidad || mesaCapacidad <= 0) {
      throw new BadRequestException('La capacidad de cada mesa debe ser mayor a 0');
    }
    if (!cantidadMesas || cantidadMesas <= 0) {
      throw new BadRequestException('La cantidad de mesas debe ser mayor o igual a 1');
    }
    if (!capacity || capacity <= 0) {
      throw new BadRequestException('La capacidad total debe ser mayor a 0');
    }

    // Convertir string a enum si existe
    const mesaTipoEnum: MesaTipo | undefined = mesaTipo
      ? MesaTipo[mesaTipo as keyof typeof MesaTipo]
      : undefined;

    const data: any = {
      name,
      address,
      phone,
      mesaCapacidad,
      cantidadMesas,
      capacity,
      description,
      adminId,
      mesaTipo: mesaTipoEnum ?? null,
      city,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
      images: images ?? [],
    };

    return this.prisma.restaurant.create({ data });
  }

  // OBTENER TODOS
  async findAll(user: any) {
    if (user.role === 'ADMIN') {
      // Admin ve solo sus restaurantes
      return this.prisma.restaurant.findMany({
        where: { adminId: user.id },
      });
    }
    // Usuarios normales ven todos
    return this.prisma.restaurant.findMany();
  }

  // OBTENER UNO
  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) throw new NotFoundException(`Restaurant with ID ${id} not found`);
    return restaurant;
  }

  // ACTUALIZAR
  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    const data: any = { ...updateRestaurantDto };

    if (updateRestaurantDto.mesaTipo) {
      data.mesaTipo = MesaTipo[updateRestaurantDto.mesaTipo as keyof typeof MesaTipo];
    }
    ['capacity', 'mesaCapacidad', 'cantidadMesas', 'latitude', 'longitude'].forEach(
      (key) => {
        if (data[key] !== undefined) data[key] = Number(data[key]);
      }
    );

    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  // ELIMINAR
  async remove(id: string) {
    // 1. Borrar HiddenReservations ligadas a reservas de este restaurante
    const reservations = await this.prisma.reservation.findMany({
      where: { restaurantId: id },
      select: { id: true },
    });
    const reservationIds = reservations.map(r => r.id);

    if (reservationIds.length > 0) {
      await this.prisma.hiddenReservation.deleteMany({
        where: { reservationId: { in: reservationIds } },
      });
    }

    // 2. Borrar reseñas, reservas y capacidades del día
    await this.prisma.review.deleteMany({ where: { restaurantId: id } });
    await this.prisma.reservation.deleteMany({ where: { restaurantId: id } });
    await this.prisma.restaurantDayCapacity.deleteMany({ where: { restaurantId: id } });

    // 3. Borrar el restaurante
    return this.prisma.restaurant.delete({ where: { id } });
  }

  // BUSCADOR: por nombre o ciudad
  async search(query: string) {
    if (!query || query.trim() === '') return [];

    return this.prisma.restaurant.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { city: { contains: query, mode: 'insensitive' } },
        ],
      },
    });
  }

  async getTablesInfo(restaurantId: string, dateStr: string) {
    if (!dateStr) {
      throw new BadRequestException('Fecha requerida');
    }

    const date = getStartOfDayUTC(dateStr);

    console.log(
      'GET TABLES → restaurantId:',
      restaurantId,
      'date:',
      date.toISOString()
    );

    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      select: { cantidadMesas: true },
    });

    if (!restaurant) {
      throw new NotFoundException('Restaurante no encontrado');
    }

    if (restaurant.cantidadMesas === null) {
      throw new BadRequestException(
        'El restaurante no tiene cantidadMesas configurada',
      );
    }

    const dayCapacity = await this.prisma.restaurantDayCapacity.findUnique({
      where: {
        restaurantId_date: {
          restaurantId,
          date, 
        },
      },
    });

    const tablesUsed = dayCapacity?.tablesUsed ?? 0;
    const totalTables = restaurant.cantidadMesas;

    return {
      totalTables,
      tablesUsed,
      availableTables: totalTables - tablesUsed,
    };
  }

  async findByAdmin(adminId: string) {
    return this.prisma.restaurant.findMany({
      where: {
        adminId: adminId, 
      },
    });
  }
}
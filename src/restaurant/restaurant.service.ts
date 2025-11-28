import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { MesaTipo } from '@prisma/client';

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
      description
    } = createRestaurantDto;

    // Validaciones
    if (!name || !address || !phone) {
      throw new BadRequestException('Nombre, dirección y teléfono son obligatorios');
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
      mesaTipo: mesaTipoEnum ?? null, // siempre asigna
    };

    return this.prisma.restaurant.create({ data });
  }

  // OBTENER TODOS
  async findAll() {
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

    if (updateRestaurantDto.capacity !== undefined) {
      data.capacity = Number(updateRestaurantDto.capacity);
    }
    if (updateRestaurantDto.mesaCapacidad !== undefined) {
      data.mesaCapacidad = Number(updateRestaurantDto.mesaCapacidad);
    }
    if (updateRestaurantDto.cantidadMesas !== undefined) {
      data.cantidadMesas = Number(updateRestaurantDto.cantidadMesas);
    }

    return this.prisma.restaurant.update({
      where: { id },
      data,
    });
  }

  // ELIMINAR
  async remove(id: string) {
    await this.prisma.review.deleteMany({ where: { restaurantId: id } });
    await this.prisma.reservation.deleteMany({ where: { restaurantId: id } });
    return this.prisma.restaurant.delete({ where: { id } });
  }
}

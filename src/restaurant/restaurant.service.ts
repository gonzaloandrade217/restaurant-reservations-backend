import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  // ✅ Crear restaurante asignando adminId desde el token
  create(createRestaurantDto: CreateRestaurantDto, adminId: string) {
    return this.prisma.restaurant.create({
      data: {
        ...createRestaurantDto,
        adminId, // se asigna automáticamente
      },
    });
  }

  // ✅ Obtener todos los restaurantes
  findAll() {
    return this.prisma.restaurant.findMany();
  }

  // ✅ Buscar restaurante por ID
  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id } });
    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }
    return restaurant;
  }

  // ✅ Actualizar restaurante
  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({ where: { id }, data: updateRestaurantDto });
  }

  // ✅ Eliminar restaurante
  async remove(id: string) {
    return this.prisma.restaurant.delete({ where: { id } });
  }

  // ✅ Buscar mesas por restaurante
  async findTables(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { tables: true },
    });

    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    return restaurant.tables;
  }
}

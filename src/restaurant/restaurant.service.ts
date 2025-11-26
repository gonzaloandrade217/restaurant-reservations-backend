import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';

@Injectable()
export class RestaurantService {
  constructor(private prisma: PrismaService) {}

  // CREAR RESTAURANTE (crea mesas automáticamente)
  async create(createRestaurantDto: CreateRestaurantDto, adminId: string) {
    const { name, address, phone, capacity, cantidadMesas, description } = createRestaurantDto;

    // Validaciones básicas
    if (!name || !address || !phone) {
      throw new BadRequestException('Nombre, dirección y teléfono son obligatorios');
    }
    if (!capacity || capacity <= 0) {
      throw new BadRequestException('La capacidad total debe ser mayor a 0');
    }
    if (!cantidadMesas || cantidadMesas <= 0) {
      throw new BadRequestException('La cantidad de mesas debe ser mayor o igual a 1');
    }

    // Determinar capacidad por mesa (redondeo hacia abajo)
    const capacidadPorMesa = Math.floor(capacity / cantidadMesas);
    if (capacidadPorMesa < 1) {
      throw new BadRequestException('La capacidad por mesa es demasiado baja. Aumentá la capacidad total o disminuí la cantidad de mesas.');
    }

    // Preparar array de mesas a crear
    const tablesToCreate = Array.from({ length: cantidadMesas }).map((_, idx) => ({
      number: idx + 1,
      capacity: capacidadPorMesa,
    }));

    // Crear restaurante + mesas en una sola transacción Prisma
    const restaurant = await this.prisma.restaurant.create({
      data: {
        name,
        address,
        phone,
        capacity,
        cantidadMesas,
        description,
        adminId,
        tables: {
          create: tablesToCreate,
        },
      },
      include: { tables: true },
    });

    return restaurant;
  }

  // GET TODOS 
  findAll() {
    return this.prisma.restaurant.findMany({ include: { tables: true } });
  }

  // GET UNO 
  async findOne(id: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id },
      include: { tables: true },
    });

    if (!restaurant) {
      throw new NotFoundException(`Restaurant with ID ${id} not found`);
    }

    return restaurant;
  }

  // UPDATE RESTAURANTE (no toca mesas por defecto)
  async update(id: string, updateRestaurantDto: UpdateRestaurantDto) {
    return this.prisma.restaurant.update({
      where: { id },
      data: updateRestaurantDto,
      include: { tables: true },
    });
  }

  // DELETE
  async remove(id: string) {
    // Primero borro reviews del restaurante
    await this.prisma.review.deleteMany({
      where: { restaurantId: id },
    });
    // Despues borro reservas 
    await this.prisma.reservation.deleteMany({
        where: { restaurantId: id },
    });
    // Despues borro mesas 
    await this.prisma.table.deleteMany({
        where: { restaurantId: id },
    });
    // Y por ultimo borro el restaurante
    return this.prisma.restaurant.delete({
      where: { id },
    });
  }

  // GET MESAS DEL RESTAURANTE
  async findTables(restaurantId: string) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: restaurantId },
      include: { tables: true },
    });

    if (!restaurant) throw new NotFoundException('Restaurante no encontrado');
    return restaurant.tables;
  }

  // AGREGAR SILLAS (capacidad) A UNA MESA
  async addSeats(tableId: string, extraSeats: number) {
    const table = await this.prisma.table.findUnique({ where: { id: tableId } });

    if (!table) throw new NotFoundException('Mesa no encontrada');

    return this.prisma.table.update({
      where: { id: tableId },
      data: {
        capacity: table.capacity + extraSeats,
      },
    });
  }

  // JUNTAR MESAS (crea una mesa nueva y elimina las viejas)
  async mergeTables(tableIds: string[]) {
    if (tableIds.length < 2) {
      throw new BadRequestException('Se necesitan al menos 2 mesas para juntar.');
    }

    const tables = await this.prisma.table.findMany({
      where: { id: { in: tableIds } },
    });

    if (tables.length !== tableIds.length) {
      throw new NotFoundException('Alguna mesa no existe.');
    }

    const restaurantId = tables[0].restaurantId;

    // Suma la capacidad total
    const newCapacity = tables.reduce((acc, t) => acc + t.capacity, 0);

    // Crea la mesa unida
    const mergedTable = await this.prisma.table.create({
      data: {
        number: Date.now() % 100000, 
        capacity: newCapacity,
        restaurantId,
      },
    });

    // Elimina las mesas anteriores
    await this.prisma.table.deleteMany({
      where: { id: { in: tableIds } },
    });

    return mergedTable;
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { RestaurantService } from './restaurant.service';
import { CreateRestaurantDto } from './dto/create-restaurant.dto';
import { UpdateRestaurantDto } from './dto/update-restaurant.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';

@Controller('restaurants')
export class RestaurantController {
  constructor(private readonly restaurantService: RestaurantService) {}

  // ADMIN — CREAR RESTAURANTE
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  create(@Req() req, @Body() dto: CreateRestaurantDto) {
    const adminId = req.user.id;

    // Convertir números
    if (dto.cantidadMesas !== undefined)
      dto.cantidadMesas = Number(dto.cantidadMesas);

    if (dto.mesaCapacidad !== undefined)
      dto.mesaCapacidad = Number(dto.mesaCapacidad);

    if (dto.capacity !== undefined)
      dto.capacity = Number(dto.capacity);

    // Normalizar mesaTipo (enum)
    if (dto.mesaTipo !== undefined && typeof dto.mesaTipo === 'string') {
      const upper = dto.mesaTipo.toUpperCase();

      const validMesaTipos = ['CUADRADA', 'RECTANGULAR', 'REDONDA'];
      if (!validMesaTipos.includes(upper)) {
        throw new BadRequestException(
          `mesaTipo inválido. Debe ser ${validMesaTipos.join(', ')}`
        );
      }

      dto.mesaTipo = upper as any;
    }

    return this.restaurantService.create(dto, adminId);
  }

  // ADMIN — ACTUALIZAR RESTAURANTE
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() dto: UpdateRestaurantDto) {
    // Convertir números
    if (dto.capacity !== undefined)
      dto.capacity = Number(dto.capacity);

    if (dto.mesaCapacidad !== undefined)
      dto.mesaCapacidad = Number(dto.mesaCapacidad);

    if (dto.cantidadMesas !== undefined)
      dto.cantidadMesas = Number(dto.cantidadMesas);

    // Normalizar mesaTipo (enum)
    if (dto.mesaTipo !== undefined && typeof dto.mesaTipo === 'string') {
      const upper = dto.mesaTipo.toUpperCase();

      const validMesaTipos = ['CUADRADA', 'RECTANGULAR', 'REDONDA'];
      if (!validMesaTipos.includes(upper)) {
        throw new BadRequestException(
          `mesaTipo inválido. Debe ser ${validMesaTipos.join(', ')}`
        );
      }

      dto.mesaTipo = upper as any;
    }

    return this.restaurantService.update(id, dto);
  }

  // ADMIN — ELIMINAR RESTAURANTE
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  // BUSQUEDA POR NOMBRE O CIUDAD
  @Get('search')
  search(@Query('q') q: string) {
    return this.restaurantService.search(q);
  }

  // PUBLIC — LISTAR TODOS
  @Get()
  findAll() {
    return this.restaurantService.findAll();
  }

  // PUBLIC — OBTENER UNO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }
}

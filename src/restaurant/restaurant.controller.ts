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
    ['cantidadMesas', 'mesaCapacidad', 'capacity', 'latitude', 'longitude'].forEach(
      (key) => {
        if (dto[key] !== undefined) dto[key] = Number(dto[key]);
      }
    );

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
    ['cantidadMesas', 'mesaCapacidad', 'capacity', 'latitude', 'longitude'].forEach(
      (key) => {
        if (dto[key] !== undefined) dto[key] = Number(dto[key]);
      }
    );

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
  @UseGuards(AuthGuard('jwt'))
  @Get()
  findAll(@Req() req) {
    return this.restaurantService.findAll(req.user);
  }

  // PUBLIC — OBTENER UNO
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  
  @Get(':id/tables')
  getTablesByDate(
  @Param('id') restaurantId: string,
  @Query('date') date: string,
  ) {
    return this.restaurantService.getTablesInfo(restaurantId, date);
  }

  @Get('admin/:adminId')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  findAllByAdmin(@Param('adminId') adminId: string) {
    return this.restaurantService.findByAdmin(adminId);
  }
}
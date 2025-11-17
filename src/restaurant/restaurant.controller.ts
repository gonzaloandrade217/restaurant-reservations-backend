import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards, 
  Req 
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

  // 🟩 SOLO ADMIN: crear restaurante
  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  create(@Req() req, @Body() createRestaurantDto: CreateRestaurantDto) {
    const adminId = req.user.id; // obtenemos el ID del admin desde el token
    return this.restaurantService.create(createRestaurantDto, adminId);
  }

  // 🟩 SOLO ADMIN: actualizar restaurante
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateRestaurantDto: UpdateRestaurantDto) {
    return this.restaurantService.update(id, updateRestaurantDto);
  }

  // 🟩 SOLO ADMIN: eliminar restaurante
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles(Role.ADMIN)
  remove(@Param('id') id: string) {
    return this.restaurantService.remove(id);
  }

  // 🟦 RUTAS PÚBLICAS
  @Get()
  findAll() {
    return this.restaurantService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.restaurantService.findOne(id);
  }

  @Get(':id/tables')
  async findTables(@Param('id') id: string) {
    return this.restaurantService.findTables(id);
  }
}

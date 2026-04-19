import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { RolesGuard } from '../auth/roles.guard';
import { Roles, Role } from '../auth/roles.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

interface JwtRequest {
  user: {
    sub: string;
    email: string;
    role: Role;
  };
}

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Post('login')
  async login(@Body() dto: LoginUserDto) {
    return this.userService.login(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.userService.findAll();
  }

  @Get('with-reservations')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  getUsersWithReservations() {
    return this.userService.getUsersWithReservations();
  }

  // Perfil del usuario logueado
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: JwtRequest) {
    // req.user viene del JwtStrategy, con tipos seguros
    return this.userService.getProfile(req.user.sub);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Patch(':id/rating')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  setRating(@Param('id') id: string, @Body() body: { rating: number }) {
    return this.userService.setAdminRating(id, body.rating);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  // RESERVAS OCULTAS (USER)

  @Get('me/hidden-reservations')
  @UseGuards(JwtAuthGuard)
  getHiddenReservations(@Request() req: JwtRequest) {
    return this.userService.getHiddenReservations(req.user.sub);
  }

  @Post('me/hidden-reservations')
  @UseGuards(JwtAuthGuard)
  hideReservation(
    @Request() req: JwtRequest,
    @Body() body: { reservationId: string },
  ) {
    return this.userService.hideReservation(
      req.user.sub,
      body.reservationId,
    );
  }
}
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  BadRequestException,
  UseGuards,
  Req,
} from "@nestjs/common";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationService } from "./reservation.service";
import { AuthGuard } from "@nestjs/passport";
import { RolesGuard } from "../auth/roles.guard";
import { Roles, Role } from "../auth/roles.decorator";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // Crear reserva (usuario)
  @Post()
  async create(@Body() dto: CreateReservationDto) {
    if (!dto.userId) throw new BadRequestException("Falta userId en la reserva");
    if (!dto.restaurantId) throw new BadRequestException("Falta restaurantId en la reserva");
    if (!dto.date) throw new BadRequestException("Falta la fecha de la reserva");
    if (!dto.partySize || dto.partySize <= 0) throw new BadRequestException("Cantidad de personas inválida");

    return this.reservationService.create(dto, dto.userId);
  }

  // Obtener todas las reservas (solo para debug/admin global)
  @Get()
  async findAll() {
    return this.reservationService.findAll();
  }

  // Obtener una reserva específica por ID
  @Get(":id")
  async findOne(@Param("id") id: string) {
    if (!id) throw new BadRequestException("ID de reserva inválido");
    return this.reservationService.findOne(id);
  }

  // Obtener reservas pendientes de los restaurantes de un admin
  @Get("admin/pending/:adminId")
  async getPending(@Param("adminId") adminId: string) {
    if (!adminId || adminId === "null") throw new BadRequestException("adminId inválido o faltante");
    return this.reservationService.findPendingByAdmin(adminId);
  }

  // Reservas aceptadas de un usuario
  @Get("user/:userId/accepted")
  async getAcceptedByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") throw new BadRequestException("userId inválido");
    return this.reservationService.findByUserAndStatus(userId, "ACCEPTED");
  }

  // Reservas rechazadas de un usuario
  @Get("user/:userId/rejected")
  async getRejectedByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") throw new BadRequestException("userId inválido");
    return this.reservationService.findByUserAndStatus(userId, "REJECTED");
  }

  // Todas las reservas de un usuario
  @Get("user/:userId")
  async getByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") throw new BadRequestException("userId inválido");
    return this.reservationService.findByUser(userId);
  }

  // Reservas aceptadas de los restaurantes de un admin
  @Get("admin/accepted/:adminId")
  async getAccepted(@Param("adminId") adminId: string) {
    if (!adminId || adminId === "null") throw new BadRequestException("adminId inválido");
    return this.reservationService.findAcceptedByAdmin(adminId);
  }

  // Agregar excepción a una reserva (solo admin)
  @Patch(":id/exception")
  @UseGuards(AuthGuard("jwt"), RolesGuard)
  @Roles(Role.ADMIN)
  async addException(
    @Req() req,
    @Param("id") id: string,
    @Body() body: { message: string }
  ) {
    if (!body?.message) throw new BadRequestException("Mensaje de excepción requerido");
    return this.reservationService.addException(id, req.user.id, body.message);
  }

  // Aceptar reserva
  @Patch(":id/accept")
  async accept(@Param("id") id: string) {
    if (!id) throw new BadRequestException("ID de reserva inválido");
    return this.reservationService.updateStatus(id, "ACCEPTED");
  }

  // Rechazar reserva
  @Patch(":id/reject")
  async reject(@Param("id") id: string) {
    if (!id) throw new BadRequestException("ID de reserva inválido");
    return this.reservationService.updateStatus(id, "REJECTED");
  }

  // Cancelar reserva admin
  @Patch(":id/cancel")
  async cancel(
    @Param("id") id: string,
    @Body("reason") reason: string
  ) {
    if (!reason || reason.trim() === "") {
      throw new BadRequestException("Debe proporcionar una razón para cancelar la reserva");
    }
    return this.reservationService.cancel(id, reason);
  }

  // Cancelar reserva usuario
  @Patch(":id/cancel-user")
  async cancelByUser(@Param("id") id: string) {
    return this.reservationService.cancelByUser(id);
  }

  // Eliminar reserva
  @Delete(":id")
  async remove(@Param("id") id: string) {
    if (!id) throw new BadRequestException("ID de reserva inválido");
    return this.reservationService.remove(id);
  }
}

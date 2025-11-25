import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Delete,
  Patch,
  BadRequestException,
} from "@nestjs/common";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationService } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  // Crear reserva (usuario)
  @Post()
  async create(@Body() dto: CreateReservationDto) {
    console.log(" DTO recibido en create:", dto);

    if (!dto.userId) {
      throw new BadRequestException("Falta userId en la reserva");
    }
    if (!dto.restaurantId) {
      throw new BadRequestException("Falta restaurantId en la reserva");
    }
    if (!dto.date) {
      throw new BadRequestException("Falta la fecha de la reserva");
    }
    
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
    return this.reservationService.findOne(id);
  }

  // Obtener reservas pendientes de los restaurantes de un admin
  @Get("admin/pending/:adminId")
  async getPending(@Param("adminId") adminId: string) {
    console.log(" Endpoint /admin/pending llamado con adminId:", adminId);

    if (!adminId || adminId === "null") {
      throw new BadRequestException("adminId inválido o faltante");
    }

    return this.reservationService.findPendingByAdmin(adminId);
  }
  @Get("user/:userId/accepted")
  async getAcceptedByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") {
      throw new BadRequestException("userId inválido");
    }

    return this.reservationService.findByUserAndStatus(userId, "ACCEPTED");
  }

  @Get("user/:userId/rejected")
  async getRejectedByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") {
      throw new BadRequestException("userId inválido");
    }

    return this.reservationService.findByUserAndStatus(userId, "REJECTED");
  }

  @Get("user/:userId")
  async getByUser(@Param("userId") userId: string) {
    if (!userId || userId === "null") {
      throw new BadRequestException("userId inválido");
    }

    return this.reservationService.findByUser(userId);
  }

  @Get("admin/accepted/:adminId")
  async getAccepted(@Param("adminId") adminId: string) {
    if (!adminId || adminId === "null") {
      throw new BadRequestException("adminId inválido");
    }
    return this.reservationService.findAcceptedByAdmin(adminId);
  }

  // Aceptar reserva
  @Patch(":id/accept")
  async accept(@Param("id") id: string) {
    console.log(" Aceptando reserva:", id);
    return this.reservationService.updateStatus(id, "ACCEPTED");
  }

  // Rechazar reserva
  @Patch(":id/reject")
  async reject(@Param("id") id: string) {
    console.log(" Rechazando reserva:", id);
    return this.reservationService.updateStatus(id, "REJECTED");
  }

  // Eliminar reserva (si se cancela)
  @Delete(":id")
  async remove(@Param("id") id: string) {
    console.log("🗑 Eliminando reserva:", id);
    return this.reservationService.remove(id);
  }
}

import { Controller, Post, Body, Get, Param, Delete } from "@nestjs/common";
import { CreateReservationDto } from "./dto/create-reservation.dto";
import { ReservationService } from "./reservation.service";

@Controller("reservations")
export class ReservationController {
  constructor(private readonly reservationService: ReservationService) {}

  @Post()
  create(@Body() dto: CreateReservationDto) {
    console.log("DTO recibido:", dto);

    if (!dto.userId) {
      throw new Error("Falta userId en la reserva");
    }

    return this.reservationService.create(dto, dto.userId);
  }

  @Get()
  findAll() {
    return this.reservationService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.reservationService.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.reservationService.remove(id);
  }
}

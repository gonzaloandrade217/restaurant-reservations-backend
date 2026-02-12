import { IsNotEmpty, IsDateString, IsInt, IsOptional, IsString } from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsString()
  @IsNotEmpty()
  time: string;

  @IsInt()
  @IsNotEmpty()
  partySize: number;

  @IsNotEmpty()
  restaurantId: string;

  @IsOptional()
  mesaId?: string;

  @IsOptional()
  userId?: string;
}

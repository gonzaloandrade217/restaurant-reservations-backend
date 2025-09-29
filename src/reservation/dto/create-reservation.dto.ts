import { IsNotEmpty, IsDateString, IsInt, IsUUID } from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsInt()
  @IsNotEmpty()
  partySize: number;

  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsUUID()
  @IsNotEmpty()
  restaurantId: string;

  @IsUUID()
  @IsNotEmpty()
  tableId: string;
}
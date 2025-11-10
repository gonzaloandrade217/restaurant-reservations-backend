import { IsNotEmpty, IsDateString, IsInt, IsOptional } from 'class-validator';

export class CreateReservationDto {
  @IsDateString()
  @IsNotEmpty()
  date: string;

  @IsInt()
  @IsNotEmpty()
  partySize: number;

  @IsNotEmpty()
  restaurantId: string;

  @IsOptional()
  tableId?: string; 

  @IsOptional()
  userId?: string;
}

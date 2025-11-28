import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  Min, 
  IsEnum 
} from 'class-validator';
import { MesaTipo } from '@prisma/client';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsOptional()
  @IsEnum(MesaTipo)
  mesaTipo?: MesaTipo; 

  @IsNumber()
  @Min(1)
  mesaCapacidad: number;

  @IsNumber()
  @Min(1)
  cantidadMesas: number;

  @IsNumber()
  @Min(1)
  capacity: number; 

  @IsOptional()
  @IsString()
  description?: string;
}
import { 
  IsString, 
  IsNotEmpty, 
  IsOptional, 
  IsNumber, 
  Min 
} from 'class-validator';

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

  @IsNumber()
  @Min(1, { message: 'La capacidad total debe ser mayor a 0' })
  capacity: number;

  @IsNumber()
  @Min(1, { message: 'La cantidad de mesas debe ser mayor o igual a 1' })
  cantidadMesas: number;

  @IsString()
  @IsOptional()
  description?: string;
}

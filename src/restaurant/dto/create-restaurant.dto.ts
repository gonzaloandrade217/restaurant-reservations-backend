import { IsString, IsNotEmpty, IsOptional, IsPhoneNumber } from 'class-validator';

export class CreateRestaurantDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsPhoneNumber('ES') 
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;
}
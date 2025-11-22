import { IsEmail, IsNotEmpty, IsString, IsEnum, IsOptional } from 'class-validator';
import { Role } from '@prisma/client'; 

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(Role) 
  role?: Role;
}

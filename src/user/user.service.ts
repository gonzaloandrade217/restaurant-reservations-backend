import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service'; 
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto, UserRole } from './dto/create-user.dto'; 
import { LoginUserDto } from './dto/login-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { name, email, password, role } = createUserDto;

    const hashedPassword = await bcrypt.hash(password, 10); 

    const finalRole = role === UserRole.ADMIN
                         ? 'ADMIN' 
                         : 'USER';

    return this.prisma.user.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword, 
        role: finalRole as 'ADMIN' | 'USER', 
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    
    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
  
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }
    
    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  remove(id: string) {
    return this.prisma.user.delete({ where: { id } });
  }

   async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new Error('Contraseña incorrecta');
    }

    return {
      token: 'fake-jwt-token', 
      role: user.role,
    };
  }
}
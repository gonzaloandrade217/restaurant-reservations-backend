import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GoogleUserDto } from './dto/google-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // CREATE NORMAL USER
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, password, role } = createUserDto;

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword || '',
          role: role ?? Role.USER,
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('El email ya está en uso');
      }
      throw error;
    }
  }

  // CREATE GOOGLE USER
  async createGoogleUser(data: GoogleUserDto & { role?: Role }) {
    try {
      return await this.prisma.user.create({
        data: {
          email: data.email,
          name: data.name,
          password: '',
          role: data.role ?? Role.USER,
          ...(data.avatar ? { avatar: data.avatar } : {}),
        },
      });
    } catch (error) {
      if (error.code === 'P2002') {
        throw new BadRequestException('Este correo ya está registrado en otra cuenta');
      }
      throw error;
    }
  }

  // FINDS
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

  async getUsersWithReservations() {
    return this.prisma.user.findMany({
      where: {
        reservations: {
          some: {},   // Usuario con al menos 1 reserva
        },
      },
      include: {
        reservations: true,  
      },
    });
  }

  // UPDATE
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
    });
  }

  // DELETE
  async remove(id: string) {
    try {
      await this.prisma.reservation.deleteMany({
        where: { userId: id },
      });

      const deletedUser = await this.prisma.user.delete({
        where: { id },
      });

      return deletedUser;
    } catch (error) {
      throw new Error(
        "No se pudo eliminar el usuario. Asegúrate de que exista y de que no haya problemas con las reservas."
      );
    }
  }

  // LOGIN NORMAL
  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) throw new BadRequestException('Usuario no encontrado');

    const passwordValid = await bcrypt.compare(dto.password, user.password || '');
    if (!passwordValid) throw new BadRequestException('Contraseña incorrecta');

    const payload = { sub: user.id, email: user.email, role: user.role };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}

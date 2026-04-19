import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { GoogleUserDto } from './dto/google-user.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@prisma/client';
import { userSafeSelect } from './dto/user-select';
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
} from 'date-fns';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // CREATE NORMAL USER
  async create(createUserDto: CreateUserDto): Promise<User> {
    const { name, email, password, role } = createUserDto;

    const hashedPassword = password
      ? await bcrypt.hash(password, 10)
      : '';

    try {
      return await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role: role ?? Role.USER,
        },
      });
    } catch (error: any) {
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
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new BadRequestException(
          'Este correo ya está registrado en otra cuenta',
        );
      }
      throw error;
    }
  }

  // FINDS
  findAll() {
    return this.prisma.user.findMany({
      select: userSafeSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: userSafeSelect,
    });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${id} no encontrado`);
    }

    return user;
  }

  async findOneByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async getUsersWithReservations() {
    return this.prisma.user.findMany({
      where: { reservations: { some: {} } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        adminRating: true,
        reservations: {
          select: {
            id: true,
            date: true,
            partySize: true,
            status: true,
            restaurantId: true,
          },
        },
      },
    });
  }

  // UPDATE
  async update(id: string, updateUserDto: UpdateUserDto) {
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(
        updateUserDto.password,
        10,
      );
    }

    return this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: userSafeSelect,
    });
  }

  // DELETE
  async remove(id: string) {
    try {
      await this.prisma.reservation.deleteMany({
        where: { userId: id },
      });

      return await this.prisma.user.delete({
        where: { id },
      });
    } catch {
      throw new BadRequestException(
        'No se pudo eliminar el usuario. Verificá que exista y que no tenga dependencias.',
      );
    }
  }

  // LOGIN NORMAL
  async login(dto: LoginUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new BadRequestException('Usuario no encontrado');
    }

    const passwordValid = await bcrypt.compare(
      dto.password,
      user.password || '',
    );

    if (!passwordValid) {
      throw new BadRequestException('Contraseña incorrecta');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

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

  // PERFIL DEL USUARIO LOGUEADO
  async getProfile(userId: string) {
    if (!userId) {
      throw new BadRequestException('User id is required');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        role: true,
        reviews: {
          select: {
            id: true,
            comment: true,
            rating: true,
            restaurant: {
              select: { name: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const reputation =
      user.reviews.length > 0
        ? user.reviews.reduce((acc, r) => acc + r.rating, 0) /
          user.reviews.length
        : 0;

    // Reservas por día del último mes
    const start = startOfMonth(subMonths(new Date(), 1));
    const end = endOfMonth(new Date());
    const days = eachDayOfInterval({ start, end });

    const reservationsPerDay: Record<string, number> = {};

    for (const day of days) {
      const count = await this.prisma.reservation.count({
        where: {
          userId,
          date: day,
        },
      });

      reservationsPerDay[format(day, 'yyyy-MM-dd')] = count;
    }

    const comments = user.reviews.map((r) => ({
      id: r.id,
      restaurantName: r.restaurant.name,
      rating: r.rating,
      comment: r.comment,
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      avatar: user.avatar,
      role: user.role,
      reputation,
      comments,
      reservationsLastMonth: reservationsPerDay,
    };
  }

  async setAdminRating(id: string, rating: number) {
    if (rating < 0 || rating > 5) throw new BadRequestException('El rating debe estar entre 0 y 5');
    return this.prisma.user.update({
      where: { id },
      data: { adminRating: rating },
      select: { id: true, adminRating: true },
    });
  }

  async getHiddenReservations(userId: string): Promise<string[]> {
  const hidden = await this.prisma.hiddenReservation.findMany({
      where: { userId },
      select: { reservationId: true },
    });

    return hidden.map(h => h.reservationId);
  }

  async hideReservation(userId: string, reservationId: string) {
    return this.prisma.hiddenReservation.upsert({
      where: {
        userId_reservationId: {
          userId,
          reservationId,
        },
      },
      update: {},
      create: {
        userId,
        reservationId,
      },
    });
  }
}
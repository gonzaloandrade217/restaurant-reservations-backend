import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';

export interface JwtPayload {
  sub: string; // ID del usuario (subject)
  email: string;
  role: string; 
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_DEV', 
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      throw new UnauthorizedException('Token inválido o usuario no encontrado.');
    }

    return { 
      sub: user.id, 
      email: user.email, 
      role: user.role 
    };
  }
}
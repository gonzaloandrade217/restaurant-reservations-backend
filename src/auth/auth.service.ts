import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { OAuth2Client } from 'google-auth-library';
import { GoogleUserDto } from 'src/user/dto/google-user.dto';
import { Role } from '@prisma/client';

type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar: string | null;
};

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // LOGIN NORMAL
  async validateUser(email: string, pass: string): Promise<AuthUser> {
    const existing = await this.userService.findOneByEmail(email);
    if (!existing || !existing.password) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const isMatch = await bcrypt.compare(pass, existing.password);
    if (!isMatch) throw new UnauthorizedException('Credenciales incorrectas');

    const safeUser: AuthUser = {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      avatar: existing.avatar,
    };

    return safeUser;
  }

  async login(user: AuthUser) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // LOGIN CON GOOGLE
  async loginWithGoogle(idToken: string, isAdmin?: boolean) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Token inválido');

    const email = payload.email;
    const name = payload.name ?? 'Usuario Google';
    const picture = payload.picture ?? null;

    if (!email) throw new UnauthorizedException('Google no devolvió email');

    const existing = await this.userService.findOneByEmail(email);

    const desiredRole: Role = isAdmin ? Role.ADMIN : Role.USER;

    if (!existing) {
      const created = await this.userService.createGoogleUser({
        email,
        name,
        avatar: picture,
        role: desiredRole,
      } as GoogleUserDto & { role: Role });

      const safeCreated: AuthUser = {
        id: created.id,
        email: created.email,
        name: created.name,
        role: created.role,
        avatar: created.avatar,
      };

      return this.login(safeCreated);
    }

    if (existing.role !== desiredRole) {
      const updated = await this.userService.update(existing.id, { role: desiredRole });

      const safeUpdated: AuthUser = {
        id: updated.id,
        email: updated.email,
        name: updated.name,
        role: updated.role,
        avatar: updated.avatar,
      };

      return this.login(safeUpdated);
    }

    const safeExisting: AuthUser = {
      id: existing.id,
      email: existing.email,
      name: existing.name,
      role: existing.role,
      avatar: existing.avatar,
    };

    return this.login(safeExisting);
  }
}

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { OAuth2Client } from 'google-auth-library';
import { GoogleUserDto } from 'src/user/dto/google-user.dto';
import { UserRole } from 'src/user/dto/create-user.dto'; // tu tipo de roles

@Injectable()
export class AuthService {
  private googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  // ----------------------------
  // LOGIN NORMAL
  // ----------------------------
  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findOneByEmail(email);

    if (user && user.password && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }

    throw new UnauthorizedException('Credenciales incorrectas');
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user,
    };
  }

  // ----------------------------
  // LOGIN CON GOOGLE
  // ----------------------------
  async loginWithGoogle(idToken: string, isAdmin?: boolean) {
    const ticket = await this.googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) throw new UnauthorizedException('Token inválido');

    const email = payload.email;
    const name = payload.name ?? 'Usuario Google';
    const picture = payload.picture ?? undefined;

    if (!email) throw new UnauthorizedException('Google no devolvió email');

    // Buscar usuario existente
    let user = await this.userService.findOneByEmail(email);

    const desiredRole: UserRole = isAdmin ? UserRole.ADMIN : UserRole.USER;

    // Tipo intermedio para evitar errores de TS
    type GoogleUserInput = {
      email: string;
      name: string;
      avatar?: string;
      role: UserRole;
    };

    if (!user) {
      // Crear usuario Google
      const googleUser: GoogleUserInput = {
        email,
        name,
        avatar: picture,
        role: desiredRole,
      };
      user = await this.userService.createGoogleUser(googleUser as GoogleUserDto & { role: UserRole });
    } else {
      // Actualizar rol si es diferente
      if (user.role !== desiredRole) {
        user = await this.userService.update(user.id, { role: desiredRole });
      }
    }

    return this.login(user);
  }
}

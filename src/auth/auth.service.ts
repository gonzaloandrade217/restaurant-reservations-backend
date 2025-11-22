import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import admin from '../firebase-admin';
import { GoogleUserDto } from 'src/user/dto/google-user.dto';
import { Role } from '@prisma/client'; 

@Injectable()
export class AuthService {
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
  // LOGIN CON GOOGLE (FIREBASE)
  // ----------------------------
  async loginWithGoogle(idToken: string, role?: string) {
    try {
      if (!idToken) throw new BadRequestException('No se envió idToken');

      // 1) Verifica token de Google usando Firebase Admin
      const decoded = await admin.auth().verifyIdToken(idToken);

      const email = decoded.email;
      const name = decoded.name ?? decoded.email?.split('@')[0] ?? 'Usuario Google';
      const picture = decoded.picture ?? undefined;

      if (!email) throw new UnauthorizedException('El token no contiene email');

      // 2) Busca si el usuario ya existe
      let user = await this.userService.findOneByEmail(email);

      // 3) Determinar rol 
      const desiredRole: Role =
        role === 'ADMIN'
          ? Role.ADMIN
          : Role.USER;

      // 4) Crear usuario si no existe
      if (!user) {
        const googleUser: GoogleUserDto = {
          email,
          name,
          avatar: picture,
          role: desiredRole,
        };

        user = await this.userService.createGoogleUser(googleUser);
      }

      // 5) Si existe pero el rol cambió, actualizar
      else if (user.role !== desiredRole) {
        user = await this.userService.update(user.id, { role: desiredRole });
      }

      // 6) Devolver JWT
      return this.login(user);
    } catch (err) {
      console.error('Error loginWithGoogle:', err);
      throw new UnauthorizedException('No se pudo validar el token de Google');
    }
  }
}

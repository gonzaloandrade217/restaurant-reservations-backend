import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ----------------------------
  // LOGIN NORMAL
  // ----------------------------
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.email,
      loginDto.password,
    );
    return this.authService.login(user);
  }

  // ----------------------------
  // LOGIN CON GOOGLE
  // ----------------------------
  @Post('google')
  async googleLogin(@Body('idToken') idToken: string) {
    return this.authService.loginWithGoogle(idToken);
  }
}

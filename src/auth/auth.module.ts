import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserService } from '../user/user.service'; 
import { PrismaModule } from '../../prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PrismaModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'SUPER_SECRET_KEY_DEV', 
      signOptions: { expiresIn: '60m' }, 
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, JwtStrategy], 
  exports: [AuthService, PassportModule, JwtModule, JwtStrategy],
})
export class AuthModule {}
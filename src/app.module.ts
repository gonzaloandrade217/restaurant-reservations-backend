import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module'; 

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'tu_usuario_sql',
      password: 'tu_password_sql',
      database: 'restaurant_db',
      autoLoadEntities: true, 
      synchronize: true,
    }),
    MongooseModule.forRoot('mongodb://localhost/reviews_db'),
    UserModule, 
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
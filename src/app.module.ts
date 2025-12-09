import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UserModule } from './user/user.module';
import { RestaurantModule } from './restaurant/restaurant.module';
import { ReservationModule } from './reservation/reservation.module';
import { ReviewModule } from './review/review.module';
import { PrismaModule } from '../prisma/prisma.module'; 
import { GeocodeModule } from './geocode/geocode.module';

@Module({
  imports: [UserModule, RestaurantModule, ReservationModule, ReviewModule, PrismaModule, GeocodeModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
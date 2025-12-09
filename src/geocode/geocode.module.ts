import { Module } from '@nestjs/common';
import { GeocodeController } from './geocode.controller';

@Module({
  controllers: [GeocodeController],
})
export class GeocodeModule {}
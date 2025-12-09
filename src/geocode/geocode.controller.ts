import { Controller, Get, Query } from '@nestjs/common';
import fetch from 'node-fetch'; 

@Controller('geocode')
export class GeocodeController {
  @Get()
  async geocode(@Query('city') city: string, @Query('address') address: string) {
    if (!city && !address) {
      return { error: 'Falta ciudad o dirección' };
    }

    const query = encodeURIComponent(`${address}, ${city}`);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`);
      const data = await res.json();
      return data;
    } catch (err) {
      return { error: 'Error al geocodificar' };
    }
  }
}

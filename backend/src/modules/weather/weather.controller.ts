import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('weather')
@UseGuards(AuthGuard('jwt'))
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('alert/:sucursalId')
  getWeatherAlert(@Param('sucursalId') sucursalId: string) {
    return this.weatherService.getAlertForSucursal(sucursalId);
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private weatherCache = new Map<string, { wbgt: number; riskLevel: string; temp: number }>();

  constructor(
    private readonly httpService: HttpService,
    private readonly prisma: PrismaService,
  ) {
    // Inicializar al arrancar
    this.updateWeatherAlerts();
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async updateWeatherAlerts() {
    this.logger.log('Updating weather alerts for all branches...');
    try {
      const sucursales = await this.prisma.sucursal.findMany({ where: { activa: true } });
      const apiKey = process.env.OPENWEATHER_API_KEY || 'dummy_key';
      
      for (const sucursal of sucursales) {
        if (!sucursal.latitud || !sucursal.longitud) continue;
        
        let temp = 25; // Default safe
        let humidity = 50;

        if (apiKey !== 'dummy_key') {
          try {
            const url = `https://api.openweathermap.org/data/2.5/weather?lat=${sucursal.latitud}&lon=${sucursal.longitud}&appid=${apiKey}&units=metric`;
            const response = await lastValueFrom(this.httpService.get(url));
            temp = response.data.main.temp;
            humidity = response.data.main.humidity;
          } catch (e: any) {
            this.logger.warn(`Failed to fetch weather for branch ${sucursal.id}: ${e.message}`);
          }
        } else {
            // Simulated variation for testing Phase 2
            temp = 20 + Math.random() * 12; // 20 - 32 C
            humidity = 40 + Math.random() * 40;
        }

        // Simplified WBGT estimation
        const wbgtEstimate = temp + (humidity / 100) * 3; 

        let riskLevel = 'BAJO';
        if (wbgtEstimate > 28) riskLevel = 'ALTO';
        else if (wbgtEstimate > 25) riskLevel = 'MEDIO';

        this.weatherCache.set(sucursal.id, { wbgt: Math.round(wbgtEstimate * 10) / 10, riskLevel, temp: Math.round(temp * 10) / 10 });
      }
    } catch (e: any) {
      this.logger.error(`Error in updateWeatherAlerts cron: ${e.message}`);
    }
  }

  getAlertForSucursal(sucursalId: string) {
    return this.weatherCache.get(sucursalId) || { wbgt: 22, riskLevel: 'BAJO', temp: 22 };
  }
}

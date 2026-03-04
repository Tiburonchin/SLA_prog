import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesService } from './notificaciones.service';

@Injectable()
export class NotificacionesCron {
  private readonly logger = new Logger(NotificacionesCron.name);

  constructor(
    private prisma: PrismaService,
    private notificaciones: NotificacionesService,
  ) {}

  // Se ejecuta todos los dias a las 8:00 AM
  @Cron(CronExpression.EVERY_DAY_AT_8AM)
  async revisarCalibracionesPorVencer() {
    this.logger.log('Ejecutando Cron: Revisión de Calibraciones por Vencer');
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(hoy.getDate() + 30);

    try {
      const calibraciones = await this.prisma.calibracion.findMany({
        where: {
          proximaCalibracion: {
            gte: hoy,
            lte: en30Dias,
          },
        },
        include: { equipo: true },
        orderBy: { proximaCalibracion: 'asc' },
      });

      if (calibraciones.length > 0) {
        await this.notificaciones.enviarAlertaCalibracion(calibraciones);
      } else {
        this.logger.log('No hay certificaciones por vencer en los próximos 30 días.');
      }
    } catch (error) {
      this.logger.error('Fallo el Cron para revisar calibraciones:', error);
    }
  }
}

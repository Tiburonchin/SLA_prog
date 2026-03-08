import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificacionesService } from './notificaciones.service';
import { EstadoEquipo } from '@prisma/client';

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

  // ────────────────────────────────────────────────────────────────────────
  // Brecha 3: Auto-bloqueo de equipos con certificación vencida
  // Se ejecuta diariamente a las 8:05 AM (5 min después del cron de alertas)
  // ────────────────────────────────────────────────────────────────────────
  @Cron('5 8 * * *')
  async bloquearEquiposConCertificadoVencido() {
    this.logger.log('Ejecutando Cron: Bloqueo automático de equipos con certificación vencida');
    const hoy = new Date();
    const estadosExcluidos: EstadoEquipo[] = [
      EstadoEquipo.BAJA_TECNICA,
      EstadoEquipo.BLOQUEADO_CERTIFICADO,
    ];

    try {
      // Buscar solo los equipos activos que tienen al menos una calibración
      const equiposActivos = await this.prisma.equipo.findMany({
        where: {
          estado: { notIn: estadosExcluidos },
          calibraciones: { some: {} },
        },
        include: {
          calibraciones: {
            orderBy: { proximaCalibracion: 'desc' },
            take: 1,
          },
        },
      });

      const equiposABloquear = equiposActivos.filter(
        (e) => e.calibraciones[0] && e.calibraciones[0].proximaCalibracion < hoy,
      );

      if (equiposABloquear.length === 0) {
        this.logger.log('No hay equipos con certificación vencida para bloquear.');
        return;
      }

      this.logger.warn(`Bloqueando ${equiposABloquear.length} equipo(s) por certificación vencida.`);

      for (const equipo of equiposABloquear) {
        const vencioEn = equipo.calibraciones[0].proximaCalibracion.toLocaleDateString('es-PE');
        await this.prisma.equipo.update({
          where: { id: equipo.id },
          data: {
            estado: EstadoEquipo.BLOQUEADO_CERTIFICADO,
            esBloqueoAutomatico: true,
            motivoBloqueoAuto: `Certificación de calibración vencida desde ${vencioEn}`,
            fechaBloqueoAuto: hoy,
          },
        });
      }

      await this.notificaciones.enviarAlertaEquipoBloqueado(equiposABloquear);
    } catch (error) {
      this.logger.error('Fallo el Cron de bloqueo automático de equipos:', error);
    }
  }
}

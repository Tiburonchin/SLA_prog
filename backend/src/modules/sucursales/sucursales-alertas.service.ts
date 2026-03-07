import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Umbrales de alerta (en días) para documentos legales críticos de cada sucursal.
 * Se disparan cuando la fecha de vencimiento está exactamente a 90, 30 o 7 días
 * de la fecha de ejecución del Cron.
 */
const UMBRALES_DIAS = [90, 30, 7] as const;

/**
 * SucursalesAlertasService
 *
 * Monitorea diariamente los documentos legales de cada sucursal y emite alertas
 * proactivas cuando los siguientes campos están próximos a vencer:
 *   - vencimientoCertificadoDC   (Certificado de Defensa Civil)
 *   - fechaVencimientoPlanEmergencia (Plan de Emergencia Ley 29783)
 *
 * Las alertas se registran como Logger.warn (siempre) y además se persisten en
 * la tabla `notificaciones` para todos los usuarios con rol COORDINADOR.
 *
 * ──────────────────────────────────────────────────────────────────────────────
 * PARA PRUEBAS EN LOCAL: cambia el @Cron por la expresión de 10 segundos:
 *
 *   @Cron('*\/10 * * * * *')   ← cada 10 segundos (sin el backslash)
 *
 * Vuelve a la expresión de producción cuando termines las pruebas:
 *
 *   @Cron('0 0 8 * * *')       ← todos los días a las 08:00:00 AM
 * ──────────────────────────────────────────────────────────────────────────────
 */
@Injectable()
export class SucursalesAlertasService {
  private readonly logger = new Logger(SucursalesAlertasService.name);

  constructor(private readonly prisma: PrismaService) {}

  // ┌──────────────────────────────────────────────────────────────────────────┐
  // │  PRODUCCIÓN  → todos los días a las 08:00 AM                            │
  // │  @Cron('0 0 8 * * *')                                                   │
  // │                                                                          │
  // │  TESTING LOCAL → cada 10 segundos                                       │
  // │  @Cron('*/10 * * * * *')                                                │
  // └──────────────────────────────────────────────────────────────────────────┘
  @Cron('0 0 8 * * *')
  async verificarVencimientosLegales(): Promise<void> {
    this.logger.log('▶ [Alertas Sucursales] Iniciando verificación de vencimientos legales...');

    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0); // Inicio del día actual (UTC normalizado)

    let totalAlertas = 0;

    for (const dias of UMBRALES_DIAS) {
      // Ventana de un día exacto: [hoy + dias, hoy + dias + 1)
      const inicio = new Date(hoy);
      inicio.setDate(inicio.getDate() + dias);

      const fin = new Date(inicio);
      fin.setDate(fin.getDate() + 1);

      // Una sola query con OR para los dos campos de vencimiento
      const sucursalesAlerta = await this.prisma.sucursal.findMany({
        where: {
          activa: true,
          deletedAt: null,
          OR: [
            {
              vencimientoCertificadoDC: {
                gte: inicio,
                lt: fin,
              },
            },
            {
              fechaVencimientoPlanEmergencia: {
                gte: inicio,
                lt: fin,
              },
            },
          ],
        },
        select: {
          id: true,
          nombre: true,
          vencimientoCertificadoDC: true,
          fechaVencimientoPlanEmergencia: true,
        },
      });

      if (sucursalesAlerta.length === 0) continue;

      totalAlertas += sucursalesAlerta.length;

      for (const sucursal of sucursalesAlerta) {
        const documentosVenciendo: string[] = [];

        if (
          sucursal.vencimientoCertificadoDC &&
          sucursal.vencimientoCertificadoDC >= inicio &&
          sucursal.vencimientoCertificadoDC < fin
        ) {
          documentosVenciendo.push(
            `Certificado DC (vence: ${sucursal.vencimientoCertificadoDC.toISOString().split('T')[0]})`,
          );
        }

        if (
          sucursal.fechaVencimientoPlanEmergencia &&
          sucursal.fechaVencimientoPlanEmergencia >= inicio &&
          sucursal.fechaVencimientoPlanEmergencia < fin
        ) {
          documentosVenciendo.push(
            `Plan de Emergencia (vence: ${sucursal.fechaVencimientoPlanEmergencia.toISOString().split('T')[0]})`,
          );
        }

        const titulo = `⚠️ Vencimiento en ${dias} días — ${sucursal.nombre}`;
        const mensaje = `Los siguientes documentos legales de la sucursal "${sucursal.nombre}" vencen en ${dias} días: ${documentosVenciendo.join(' | ')}. Renueve con anticipación para mantener la conformidad SUNAFIL/INDECI.`;

        // 1. Siempre emitir Logger.warn para trazabilidad en logs del servidor
        this.logger.warn(`${titulo} → ${documentosVenciendo.join(' | ')}`);

        // 2. Persistir en tabla notificaciones para todos los COORDINADORES
        await this.crearNotificacionesParaCoordinadores(titulo, mensaje, sucursal.id);
      }
    }

    if (totalAlertas === 0) {
      this.logger.log('✅ [Alertas Sucursales] Sin vencimientos próximos en las próximas ventanas de 90/30/7 días.');
    } else {
      this.logger.warn(`⚠️ [Alertas Sucursales] Verificación finalizada — ${totalAlertas} alerta(s) procesada(s).`);
    }
  }

  /**
   * Inserta una Notificacion en la tabla para cada usuario con rol COORDINADOR.
   * Este rol es el responsable administrativo del sistema HSE (ver esquema: enum Rol).
   *
   * Si no existe ningún COORDINADOR activo, el aviso queda registrado solo en los logs.
   */
  private async crearNotificacionesParaCoordinadores(
    titulo: string,
    mensaje: string,
    sucursalId: string,
  ): Promise<void> {
    try {
      const coordinadores = await this.prisma.usuario.findMany({
        where: {
          rol: 'COORDINADOR',
          activo: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (coordinadores.length === 0) {
        this.logger.warn(
          `[Alertas Sucursales] No se encontraron coordinadores activos para la notificación de sucursal ${sucursalId}.`,
        );
        return;
      }

      await this.prisma.notificacion.createMany({
        data: coordinadores.map((coord) => ({
          destinatarioId: coord.id,
          tipo: 'VENCIMIENTO_DOCUMENTO_LEGAL',
          titulo,
          mensaje,
        })),
        skipDuplicates: false,
      });

      this.logger.log(
        `[Alertas Sucursales] Notificación creada para ${coordinadores.length} coordinador(es).`,
      );
    } catch (error) {
      // No propagar — un fallo en notificaciones no debe cortar el loop del Cron
      this.logger.error(
        `[Alertas Sucursales] Error al persistir notificación para sucursal ${sucursalId}:`,
        error,
      );
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * DashboardService — Motor de KPIs de Riesgo Activo
 *
 * Consolida tres señales de riesgo en tiempo real que el frontend muestra
 * como tareas de prevención activa en el tablero principal.
 *
 * Nota arquitectural sobre Equipos:
 *   El modelo `Equipo` en el schema no tiene `sucursalId`. Por lo tanto,
 *   la consulta de calibraciones vencidas es global (todas las sedes).
 *   Si en el futuro se añade la relación Equipo→Sucursal, este query
 *   debe actualizarse para filtrar por sucursalId.
 */
@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consolida los tres KPIs de riesgo activo en una sola llamada.
   * Todas las queries se ejecutan en paralelo para minimizar latencia.
   *
   * @param sucursalId  UUID de la sede. Aplica a trabajadores e inspecciones.
   *                    Para equipos es ignorado (sin relación directa en schema).
   */
  async getRiesgosActivos(sucursalId?: string) {
    const hoyInicio = new Date();
    hoyInicio.setHours(0, 0, 0, 0);

    const hoyFin = new Date();
    hoyFin.setHours(23, 59, 59, 999);

    // Ventana "próximo a vencer": 30 días calendario
    const limite30Dias = new Date();
    limite30Dias.setDate(limite30Dias.getDate() + 30);

    const [equiposVencidos, trabajadoresEmoRiesgo, inspeccionesAbiertas] =
      await Promise.all([
        this._equiposConCalibracionVencida(),
        this._trabajadoresSinEmoVigente(sucursalId, limite30Dias),
        this._inspeccionesAbiertasHoy(sucursalId, hoyInicio, hoyFin),
      ]);

    return {
      generadoEn: new Date().toISOString(),
      sucursalId: sucursalId ?? 'todas',
      kpis: {
        equiposConMantenimientoVencido: {
          total: equiposVencidos.length,
          // Advertencia: no filtrado por sucursal (sin relación en schema)
          alcance: 'global',
          detalle: equiposVencidos,
        },
        trabajadoresSinEmoVigente: {
          total: trabajadoresEmoRiesgo.length,
          alcance: sucursalId ? 'sucursal' : 'global',
          detalle: trabajadoresEmoRiesgo,
        },
        inspeccionesAbiertasHoy: {
          total: inspeccionesAbiertas.length,
          alcance: sucursalId ? 'sucursal' : 'global',
          nota: 'Inspecciones EN_PROGRESO iniciadas hoy sin cierre registrado',
          detalle: inspeccionesAbiertas,
        },
      },
    };
  }

  // ─── Equipos con calibración vencida ─────────────────────────────────────────
  /**
   * Busca equipos cuya calibración más reciente tiene `proximaCalibracion`
   * anterior a hoy. Equivale a "equipo con mantenimiento/calibración vencida".
   *
   * Estrategia: `distinct` sobre equipoId ordenado DESC → devuelve la
   * calibración más reciente por equipo y filtra las que ya pasaron.
   */
  private async _equiposConCalibracionVencida() {
    const ahora = new Date();

    // Distinct en Prisma: el primer registro por equipoId (desc) = más reciente
    const calibracionesVencidas = await this.prisma.calibracion.findMany({
      where: {
        proximaCalibracion: { lt: ahora },
        equipo: {
          deletedAt: null,
          estado: { not: 'BAJA_TECNICA' },
        },
      },
      distinct: ['equipoId'],
      orderBy: { proximaCalibracion: 'desc' },
      select: {
        equipoId: true,
        proximaCalibracion: true,
        equipo: {
          select: {
            id: true,
            nombre: true,
            marca: true,
            numeroSerie: true,
            estado: true,
          },
        },
      },
    });

    return calibracionesVencidas.map((c) => ({
      equipoId: c.equipoId,
      nombre: c.equipo.nombre,
      marca: c.equipo.marca,
      numeroSerie: c.equipo.numeroSerie,
      estadoActual: c.equipo.estado,
      calibracionVencioEl: c.proximaCalibracion,
      diasVencido: Math.floor(
        (Date.now() - c.proximaCalibracion.getTime()) / 86_400_000,
      ),
    }));
  }

  // ─── Trabajadores activos sin EMO vigente ─────────────────────────────────────
  /**
   * Devuelve trabajadores ACTIVOS donde:
   *   a) fechaVencimientoEMO es NULL (nunca registraron EMO), O
   *   b) estadoEMO != APTO, O
   *   c) fechaVencimientoEMO ≤ 30 días a partir de hoy ("próximo a vencer")
   */
  private async _trabajadoresSinEmoVigente(
    sucursalId: string | undefined,
    limite30Dias: Date,
  ) {
    const trabajadores = await this.prisma.trabajador.findMany({
      where: {
        activo: true,
        estadoLaboral: 'ACTIVO',
        deletedAt: null,
        ...(sucursalId ? { sucursalId } : {}),
        OR: [
          { fechaVencimientoEMO: null },
          { estadoEMO: { not: 'APTO' } },
          { fechaVencimientoEMO: { lte: limite30Dias } },
        ],
      },
      select: {
        id: true,
        nombreCompleto: true,
        cargo: true,
        dni: true,
        estadoEMO: true,
        fechaVencimientoEMO: true,
        sucursalId: true,
        sucursal: { select: { nombre: true } },
      },
      orderBy: { fechaVencimientoEMO: 'asc' },
    });

    return trabajadores.map((t) => ({
      trabajadorId: t.id,
      nombreCompleto: t.nombreCompleto,
      cargo: t.cargo,
      dni: t.dni,
      estadoEMO: t.estadoEMO,
      fechaVencimientoEMO: t.fechaVencimientoEMO,
      sucursal: t.sucursal.nombre,
      diasRestantes:
        t.fechaVencimientoEMO
          ? Math.ceil(
              (t.fechaVencimientoEMO.getTime() - Date.now()) / 86_400_000,
            )
          : null,
      motivo:
        t.fechaVencimientoEMO === null
          ? 'SIN_REGISTRO_EMO'
          : t.estadoEMO !== 'APTO'
          ? 'ESTADO_NO_APTO'
          : 'PROXIMO_A_VENCER',
    }));
  }

  // ─── Inspecciones abiertas iniciadas hoy ─────────────────────────────────────
  /**
   * Retorna inspecciones con estado EN_PROGRESO creadas dentro de la fecha de
   * hoy que aún no registran cierre. Interpretación del requisito
   * "programadas para hoy sin iniciar": en el schema no existe estado
   * PENDIENTE, por lo que se exponen las abiertas del día como señal de
   * trabajo en campo sin completar.
   */
  private async _inspeccionesAbiertasHoy(
    sucursalId: string | undefined,
    hoyInicio: Date,
    hoyFin: Date,
  ) {
    const inspecciones = await this.prisma.inspeccion.findMany({
      where: {
        estado: 'EN_PROGRESO',
        fechaCierre: null,
        deletedAt: null,
        creadoEn: { gte: hoyInicio, lte: hoyFin },
        ...(sucursalId ? { sucursalId } : {}),
      },
      select: {
        id: true,
        ubicacion: true,
        tipoTrabajo: true,
        creadoEn: true,
        sucursal: { select: { nombre: true } },
        supervisor: {
          select: {
            usuario: { select: { nombreCompleto: true } },
          },
        },
      },
      orderBy: { creadoEn: 'asc' },
    });

    return inspecciones.map((i) => ({
      inspeccionId: i.id,
      tipoTrabajo: i.tipoTrabajo,
      ubicacion: i.ubicacion,
      sucursal: i.sucursal.nombre,
      supervisor: i.supervisor.usuario.nombreCompleto,
      iniciadaHaceMinutos: Math.floor(
        (Date.now() - i.creadoEn.getTime()) / 60_000,
      ),
    }));
  }
}

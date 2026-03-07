import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { DashboardService } from './dashboard.service';

/**
 * DashboardController
 *
 * Expone los KPIs de riesgo activo para el "Tablero de Tareas de Prevención Activa".
 * Todos los roles autenticados tienen acceso de lectura (COORDINADOR, SUPERVISOR,
 * JEFATURA) — la granularidad se controla via el query param `sucursalId`.
 */
@Controller('dashboard')
@UseGuards(AuthGuard('jwt'))
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * GET /api/dashboard/riesgos-activos
   *
   * Consolida tres KPIs de prevención en tiempo real:
   *   1. Equipos con calibración/mantenimiento vencido
   *   2. Trabajadores activos sin EMO vigente o próximos a vencer (≤30 días)
   *   3. Inspecciones EN_PROGRESO iniciadas hoy sin cierre registrado
   *
   * @param sucursalId  (Opcional) UUID de la sede para filtrar los KPIs 2 y 3.
   *                    El KPI 1 (equipos) es siempre global porque el modelo
   *                    Equipo no tiene relación directa con Sucursal en el schema.
   *
   * @example GET /api/dashboard/riesgos-activos
   * @example GET /api/dashboard/riesgos-activos?sucursalId=uuid-de-la-sede
   */
  @Get('riesgos-activos')
  async getRiesgosActivos(@Query('sucursalId') sucursalId?: string) {
    return this.dashboardService.getRiesgosActivos(sucursalId);
  }
}

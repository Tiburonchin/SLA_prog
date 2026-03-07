import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { IncidentesService } from './incidentes.service';
import { IncidenteRapidoDto } from './dto/incidente-rapido.dto';

/**
 * IncidentesController
 *
 * Gestiona el registro de incidentes de seguridad laboral.
 * El endpoint de reporte rápido cumple con el Art. 82 de la Ley 29783
 * sobre notificación inmediata de incidentes en campo.
 */
@Controller('incidentes')
@UseGuards(AuthGuard('jwt'))
export class IncidentesController {
  constructor(private readonly incidentesService: IncidentesService) {}

  /**
   * POST /api/incidentes/rapido
   *
   * Registra un incidente de seguridad de forma mínima desde campo,
   * cumpliendo con el mandato de reporte inmediato del Art. 82 Ley 29783.
   *
   * Solo requiere 3 campos:
   *   - `tipo`             : Clasificación del evento (enum TipoIncidente)
   *   - `trabajadorId`     : UUID del trabajador involucrado
   *   - `descripcionBreve` : Descripción máx. 500 caracteres
   *
   * La fecha del evento se fija automáticamente al momento del POST.
   * La investigación detallada puede completarse después.
   *
   * Acceso: COORDINADOR y SUPERVISOR (quienes están en campo).
   * JEFATURA solo tiene acceso de lectura/dashboard, no puede reportar.
   *
   * @example
   * POST /api/incidentes/rapido
   * {
   *   "tipo": "CASI_ACCIDENTE",
   *   "trabajadorId": "uuid-del-trabajador",
   *   "descripcionBreve": "Trabajador resbaló en el área de carga, sin lesiones visibles."
   * }
   */
  @Post('rapido')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async reporteRapido(@Req() req: any, @Body() dto: IncidenteRapidoDto) {
    return this.incidentesService.reporteRapido(dto, req.user.id);
  }
}

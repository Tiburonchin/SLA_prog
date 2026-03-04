import {
  Controller, Get, Post, Put, Body, Param, Query, UseGuards, ParseUUIDPipe, Req, Header
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { InspeccionesService } from './inspecciones.service';
import { CrearInspeccionDto, CerrarInspeccionDto, ActualizarChecklistDto } from './dto/inspeccion.dto';

@Controller('inspecciones')
@UseGuards(AuthGuard('jwt'))
export class InspeccionesController {
  constructor(private inspeccionesService: InspeccionesService) {}

  // GET /api/inspecciones
  @Get()
  async obtenerTodas(@Query() filtros: { supervisorId?: string; sucursalId?: string; estado?: string }) {
    return this.inspeccionesService.obtenerTodas(filtros);
  }

  // GET /api/inspecciones/estadisticas
  @Get('estadisticas')
  async estadisticas() {
    return this.inspeccionesService.estadisticas();
  }

  // GET /api/inspecciones/exportar/csv
  @Get('exportar/csv')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'JEFATURA')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="inspecciones.csv"')
  async exportarCsv() {
    return this.inspeccionesService.exportarCsv();
  }

  // GET /api/inspecciones/recientes
  @Get('recientes')
  async obtenerRecientes() {
    return this.inspeccionesService.obtenerRecientes(5);
  }

  // GET /api/inspecciones/:id
  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.inspeccionesService.obtenerPorId(id);
  }

  // POST /api/inspecciones
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async crear(@Req() req: any, @Body() dto: CrearInspeccionDto) {
    // Si no es coordinador, forzamos que el supervisorId sea él mismo
    if (req.user.rol !== 'COORDINADOR') {
      // Necesitamos asegurar que no envíe un ID falso. El JWT no tiene el supervisorId directamente, 
      // pero el id del usuario se usa. En realidad la relación Usuario -> Supervisor: el supervisor tiene usuarioId.
      // Mejor lo validamos en el servicio o inyectamos. Lo pasaremos al servicio y que él valide, o extraemos el supervisorId aquí.
      // Modificamos el dto.supervisorId? Mejor pasamos req.user al servicio.
    }
    return this.inspeccionesService.crear(req.user, dto);
  }

  // PUT /api/inspecciones/:id/checklist
  @Put(':id/checklist')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async actualizarChecklist(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarChecklistDto) {
    return this.inspeccionesService.actualizarChecklist(req.user, id, dto);
  }

  // POST /api/inspecciones/:id/cerrar
  @Post(':id/cerrar')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async cerrar(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CerrarInspeccionDto) {
    return this.inspeccionesService.cerrar(req.user, id, dto);
  }
}

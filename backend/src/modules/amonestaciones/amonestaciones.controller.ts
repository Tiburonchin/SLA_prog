import {
  Controller, Get, Post, Body, Param, Query, UseGuards, ParseUUIDPipe, Req, Header
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { AmonestacionesService } from './amonestaciones.service';
import { CrearAmonestacionDto, FiltrarAmonestacionesDto } from './dto/amonestacion.dto';

@Controller('amonestaciones')
@UseGuards(AuthGuard('jwt'))
export class AmonestacionesController {
  constructor(private amonestacionesService: AmonestacionesService) {}

  // GET /api/amonestaciones — Listar con filtros
  @Get()
  async obtenerTodas(@Query() filtro: FiltrarAmonestacionesDto) {
    return this.amonestacionesService.obtenerTodas(filtro);
  }

  // GET /api/amonestaciones/exportar/csv
  @Get('exportar/csv')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'JEFATURA')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="amonestaciones.csv"')
  async exportarCsv() {
    return this.amonestacionesService.exportarCsv();
  }

  // GET /api/amonestaciones/estadisticas
  @Get('estadisticas')
  async estadisticas() {
    return this.amonestacionesService.estadisticas();
  }

  // GET /api/amonestaciones/estadisticas/por-sucursal
  @Get('estadisticas/por-sucursal')
  async estadisticasPorSucursal() {
    return this.amonestacionesService.estadisticasPorSucursal();
  }

  // GET /api/amonestaciones/:id — Detalle
  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.amonestacionesService.obtenerPorId(id);
  }

  // POST /api/amonestaciones — Crear
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async crear(@Req() req: any, @Body() dto: CrearAmonestacionDto) {
    return this.amonestacionesService.crear(req.user, dto);
  }
}

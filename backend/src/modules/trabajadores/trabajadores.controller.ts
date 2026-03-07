import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
  UseGuards, ParseUUIDPipe, Req
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { TrabajadoresService } from './trabajadores.service';
import { CrearTrabajadorDto, ActualizarTrabajadorDto } from './dto/trabajador.dto';
import { CrearEntregaEppDto } from './dto/trabajador-epp.dto';
import { CrearCapacitacionDto } from './dto/trabajador-cap.dto';

@Controller('trabajadores')
@UseGuards(AuthGuard('jwt'))
export class TrabajadoresController {
  constructor(private trabajadoresService: TrabajadoresService) {}

  // GET /api/trabajadores — Listar todos (paginado)
  @Get()
  async obtenerTodos(
    @Req() req: any,
    @Query('busqueda') busqueda?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.trabajadoresService.obtenerTodos(
      req.user,
      busqueda,
      sucursalId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // GET /api/trabajadores/qr/:token — Buscar por QR
  @Get('qr/:token')
  async buscarPorQr(@Req() req: any, @Param('token') token: string) {
    return this.trabajadoresService.obtenerPorQr(req.user, token);
  }

  // GET /api/trabajadores/:id/emergencia — Datos Médicos
  @Get(':id/emergencia')
  async obtenerEmergencia(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.obtenerEmergencia(req.user, id);
  }

  // GET /api/trabajadores/:id — Perfil 360°
  @Get(':id')
  async obtenerPorId(@Req() req: any, @Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.obtenerPorId(req.user, id);
  }

  // POST /api/trabajadores — Crear
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async crear(@Req() req: any, @Body() dto: CrearTrabajadorDto) {
    return this.trabajadoresService.crear(req.user, dto);
  }

  // PUT /api/trabajadores/:id — Actualizar
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async actualizar(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarTrabajadorDto) {
    return this.trabajadoresService.actualizar(req.user, id, dto);
  }

  // DELETE /api/trabajadores/:id — Desactivar
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.desactivar(id);
  }

  // POST /api/trabajadores/:id/epp — Registrar EPP
  @Post(':id/epp')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async registrarEntregaEpp(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearEntregaEppDto) {
    return this.trabajadoresService.registrarEntregaEpp(req.user, id, dto);
  }

  // POST /api/trabajadores/:id/capacitaciones — Registrar Curso
  @Post(':id/capacitaciones')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async registrarCapacitacion(@Req() req: any, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearCapacitacionDto) {
    return this.trabajadoresService.registrarCapacitacion(req.user, id, dto);
  }
}

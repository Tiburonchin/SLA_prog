import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
  UseGuards, ParseUUIDPipe
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
    @Query('busqueda') busqueda?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.trabajadoresService.obtenerTodos(
      busqueda,
      sucursalId,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  // GET /api/trabajadores/estadisticas
  @Get('estadisticas')
  async estadisticas() {
    return this.trabajadoresService.estadisticas();
  }

  // GET /api/trabajadores/qr/:token — Buscar por QR
  @Get('qr/:token')
  async buscarPorQr(@Param('token') token: string) {
    return this.trabajadoresService.obtenerPorQr(token);
  }

  // GET /api/trabajadores/:id — Perfil 360°
  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.trabajadoresService.obtenerPorId(id);
  }

  // POST /api/trabajadores — Crear
  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async crear(@Body() dto: CrearTrabajadorDto) {
    return this.trabajadoresService.crear(dto);
  }

  // PUT /api/trabajadores/:id — Actualizar
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarTrabajadorDto) {
    return this.trabajadoresService.actualizar(id, dto);
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
  async registrarEntregaEpp(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearEntregaEppDto) {
    return this.trabajadoresService.registrarEntregaEpp(id, dto);
  }

  // POST /api/trabajadores/:id/capacitaciones — Registrar Curso
  @Post(':id/capacitaciones')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async registrarCapacitacion(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearCapacitacionDto) {
    return this.trabajadoresService.registrarCapacitacion(id, dto);
  }
}

import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
  UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { EquiposService } from './equipos.service';
import { CrearEquipoDto, ActualizarEquipoDto, CrearCalibracionDto } from './dto/equipo.dto';

@Controller('equipos')
@UseGuards(AuthGuard('jwt'))
export class EquiposController {
  constructor(private equiposService: EquiposService) {}

  @Get()
  async obtenerTodos(
    @Query('busqueda') busqueda?: string,
    @Query('estado') estado?: string,
  ) {
    return this.equiposService.obtenerTodos(busqueda, estado);
  }

  @Get('calibraciones/por-vencer')
  async calibracionesPorVencer() {
    return this.equiposService.calibracionesPorVencer();
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.equiposService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async crear(@Body() dto: CrearEquipoDto) {
    return this.equiposService.crear(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarEquipoDto) {
    return this.equiposService.actualizar(id, dto);
  }

  @Post('calibraciones')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async agregarCalibracion(@Body() dto: CrearCalibracionDto) {
    return this.equiposService.agregarCalibracion(dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.equiposService.desactivar(id);
  }
}

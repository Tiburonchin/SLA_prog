import {
  Controller, Get, Post, Body, Param,
  UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { MantenimientosService } from './mantenimientos.service';
import { CrearMantenimientoDto } from './dto/mantenimiento.dto';

@Controller('mantenimientos')
@UseGuards(AuthGuard('jwt'))
export class MantenimientosController {
  constructor(private mantenimientosService: MantenimientosService) {}

  @Get('equipo/:equipoId')
  async obtenerPorEquipo(@Param('equipoId', ParseUUIDPipe) equipoId: string) {
    return this.mantenimientosService.obtenerPorEquipo(equipoId);
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.mantenimientosService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR', 'SUPERVISOR')
  async crear(@Body() dto: CrearMantenimientoDto) {
    return this.mantenimientosService.crear(dto);
  }
}

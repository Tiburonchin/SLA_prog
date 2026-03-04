import {
  Controller, Get, Post, Put, Delete,
  Body, Param, Query,
  UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { SupervisoresService } from './supervisores.service';
import { CrearSupervisorDto, ActualizarSupervisorDto } from './dto/supervisor.dto';

@Controller('supervisores')
@UseGuards(AuthGuard('jwt'))
export class SupervisoresController {
  constructor(private supervisoresService: SupervisoresService) {}

  @Get()
  async obtenerTodos(@Query('busqueda') busqueda?: string) {
    return this.supervisoresService.obtenerTodos(busqueda);
  }

  // Usuarios SUPERVISOR disponibles (sin perfil de supervisor asignado)
  @Get('usuarios-disponibles')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async usuariosDisponibles() {
    return this.supervisoresService.usuariosDisponibles();
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervisoresService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async crear(@Body() dto: CrearSupervisorDto) {
    return this.supervisoresService.crear(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarSupervisorDto) {
    return this.supervisoresService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.supervisoresService.desactivar(id);
  }
}

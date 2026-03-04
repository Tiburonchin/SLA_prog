import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { SucursalesService } from './sucursales.service';
import { CrearSucursalDto, ActualizarSucursalDto } from './dto/sucursal.dto';

@Controller('sucursales')
@UseGuards(AuthGuard('jwt'))
export class SucursalesController {
  constructor(private sucursalesService: SucursalesService) {}

  @Get()
  async obtenerTodas() {
    return this.sucursalesService.obtenerTodas();
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalesService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async crear(@Body() dto: CrearSucursalDto) {
    return this.sucursalesService.crear(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarSucursalDto) {
    return this.sucursalesService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.sucursalesService.desactivar(id);
  }
}

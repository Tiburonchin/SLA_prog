import {
  Controller, Get, Post, Put, Delete,
  Body, Param, UseGuards, ParseUUIDPipe
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { MatrizIpcService } from './matriz-ipc.service';
import { CrearMatrizIpcDto, ActualizarMatrizIpcDto } from './dto/matriz-ipc.dto';

@Controller('matriz-ipc')
@UseGuards(AuthGuard('jwt'))
export class MatrizIpcController {
  constructor(private readonly matrizIpcService: MatrizIpcService) {}

  @Get()
  async obtenerTodos() {
    return this.matrizIpcService.obtenerTodos();
  }

  @Get(':id')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.matrizIpcService.obtenerPorId(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async crear(@Body() dto: CrearMatrizIpcDto) {
    return this.matrizIpcService.crear(dto);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarMatrizIpcDto) {
    return this.matrizIpcService.actualizar(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.matrizIpcService.desactivar(id);
  }
}

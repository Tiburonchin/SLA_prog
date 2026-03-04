import { Controller, Get, Param, Delete, UseGuards, Request, ParseUUIDPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsuariosService } from './usuarios.service';
import { RolesGuard, Roles } from '../auth/roles.guard';

@Controller('usuarios')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  /**
   * GET /api/usuarios/perfil
   * Obtener el perfil del usuario autenticado
   */
  @Get('perfil')
  async obtenerPerfil(@Request() req: any) {
    return this.usuariosService.obtenerPerfil(req.user.id);
  }

  /**
   * GET /api/usuarios
   * Listar todos los usuarios (solo coordinadores)
   */
  @Get()
  @Roles('COORDINADOR')
  async obtenerTodos() {
    return this.usuariosService.obtenerTodos();
  }

  /**
   * GET /api/usuarios/:id
   * Obtener un usuario por ID (solo coordinadores)
   */
  @Get(':id')
  @Roles('COORDINADOR')
  async obtenerPorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.obtenerPorId(id);
  }

  /**
   * DELETE /api/usuarios/:id
   * Desactivar un usuario (solo coordinadores)
   */
  @Delete(':id')
  @Roles('COORDINADOR')
  async desactivar(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    return this.usuariosService.desactivar(id, req.user.id);
  }
}

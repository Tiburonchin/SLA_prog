import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UsuariosService {
  constructor(private prisma: PrismaService) {}

  /**
   * Obtener todos los usuarios del sistema
   */
  async obtenerTodos() {
    return this.prisma.usuario.findMany({
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        rol: true,
        activo: true,
        creadoEn: true,
      },
      orderBy: { creadoEn: 'desc' },
    });
  }

  /**
   * Obtener un usuario por su ID
   */
  async obtenerPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        rol: true,
        activo: true,
        creadoEn: true,
        actualizadoEn: true,
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Obtener el perfil del usuario autenticado
   */
  async obtenerPerfil(usuarioId: string) {
    return this.obtenerPorId(usuarioId);
  }

  /**
   * Desactivar un usuario (soft delete)
   */
  async desactivar(id: string, requesterId: string) {
    if (id === requesterId) {
      throw new BadRequestException('No puedes desactivar tu propia cuenta');
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { id } });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return this.prisma.usuario.update({
      where: { id },
      data: { activo: false },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
        activo: true,
      },
    });
  }
}

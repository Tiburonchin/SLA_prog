import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearSupervisorDto, ActualizarSupervisorDto } from './dto/supervisor.dto';

@Injectable()
export class SupervisoresService {
  constructor(private prisma: PrismaService) {}

  // Listar todos los supervisores con usuario y sucursales
  async obtenerTodos(busqueda?: string) {
    const where: any = {
      usuario: { activo: true },
    };

    if (busqueda) {
      where.usuario = {
        ...where.usuario,
        OR: [
          { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
          { correo: { contains: busqueda, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.supervisor.findMany({
      where,
      include: {
        usuario: {
          select: {
            id: true,
            correo: true,
            nombreCompleto: true,
            rol: true,
            activo: true,
          },
        },
        sucursales: {
          include: {
            sucursal: { select: { id: true, nombre: true } },
          },
        },
        _count: {
          select: {
            inspecciones: true,
            amonestaciones: true,
          },
        },
      },
      orderBy: { usuario: { nombreCompleto: 'asc' } },
    });
  }

  // Detalle de un supervisor con relaciones completas
  async obtenerPorId(id: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id },
      include: {
        usuario: {
          select: {
            id: true,
            correo: true,
            nombreCompleto: true,
            rol: true,
            activo: true,
            creadoEn: true,
          },
        },
        sucursales: {
          include: {
            sucursal: true,
          },
        },
        inspecciones: {
          take: 5,
          orderBy: { creadoEn: 'desc' },
          include: {
            sucursal: { select: { nombre: true } },
          },
        },
        amonestaciones: {
          take: 5,
          orderBy: { creadoEn: 'desc' },
          include: {
            trabajador: { select: { nombreCompleto: true, dni: true } },
            sucursal: { select: { nombre: true } },
          },
        },
        _count: {
          select: {
            inspecciones: true,
            amonestaciones: true,
          },
        },
      },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor no encontrado');
    }

    return supervisor;
  }

  // Crear un nuevo supervisor vinculado a un usuario
  async crear(dto: CrearSupervisorDto) {
    // Verificar que el usuario existe y tiene rol SUPERVISOR
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: dto.usuarioId },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    if (usuario.rol !== 'SUPERVISOR') {
      throw new BadRequestException('El usuario debe tener rol SUPERVISOR');
    }

    // Verificar que no tenga ya un perfil de supervisor
    const existente = await this.prisma.supervisor.findUnique({
      where: { usuarioId: dto.usuarioId },
    });

    if (existente) {
      throw new ConflictException('Este usuario ya tiene un perfil de supervisor');
    }

    // Crear supervisor con sucursales opcionales
    const supervisor = await this.prisma.supervisor.create({
      data: {
        usuarioId: dto.usuarioId,
        telefono: dto.telefono,
        sucursales: dto.sucursalIds?.length
          ? {
              create: dto.sucursalIds.map((sucursalId) => ({
                sucursalId,
              })),
            }
          : undefined,
      },
      include: {
        usuario: {
          select: { id: true, correo: true, nombreCompleto: true, rol: true, activo: true },
        },
        sucursales: {
          include: { sucursal: { select: { id: true, nombre: true } } },
        },
      },
    });

    return supervisor;
  }

  // Actualizar teléfono y reasignar sucursales
  async actualizar(id: string, dto: ActualizarSupervisorDto) {
    const supervisor = await this.prisma.supervisor.findUnique({ where: { id } });
    if (!supervisor) {
      throw new NotFoundException('Supervisor no encontrado');
    }

    // Actualizar teléfono
    if (dto.telefono !== undefined) {
      await this.prisma.supervisor.update({
        where: { id },
        data: { telefono: dto.telefono },
      });
    }

    // Reasignar sucursales si se proporcionan
    if (dto.sucursalIds !== undefined) {
      await this.prisma.$transaction(async (tx) => {
        // Eliminar asignaciones actuales
        await tx.supervisorSucursal.deleteMany({
          where: { supervisorId: id },
        });

        // Crear nuevas asignaciones
        if (dto.sucursalIds!.length > 0) {
          await tx.supervisorSucursal.createMany({
            data: dto.sucursalIds!.map((sucursalId) => ({
              supervisorId: id,
              sucursalId,
            })),
          });
        }
      });
    }

    // Retornar supervisor actualizado
    return this.prisma.supervisor.findUnique({
      where: { id },
      include: {
        usuario: {
          select: { id: true, correo: true, nombreCompleto: true, rol: true, activo: true },
        },
        sucursales: {
          include: { sucursal: { select: { id: true, nombre: true } } },
        },
        _count: {
          select: { inspecciones: true, amonestaciones: true },
        },
      },
    });
  }

  // Desactivar supervisor (soft delete del usuario asociado)
  async desactivar(id: string) {
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { id },
      include: { usuario: true },
    });

    if (!supervisor) {
      throw new NotFoundException('Supervisor no encontrado');
    }

    await this.prisma.usuario.update({
      where: { id: supervisor.usuarioId },
      data: { activo: false },
    });

    return { message: 'Supervisor desactivado correctamente' };
  }

  // Obtener usuarios con rol SUPERVISOR que aún no tienen perfil de supervisor
  async usuariosDisponibles() {
    return this.prisma.usuario.findMany({
      where: {
        rol: 'SUPERVISOR',
        activo: true,
        supervisor: null,
      },
      select: {
        id: true,
        correo: true,
        nombreCompleto: true,
      },
      orderBy: { nombreCompleto: 'asc' },
    });
  }

  // Estadísticas
  async estadisticas() {
    const [total, activos] = await Promise.all([
      this.prisma.supervisor.count(),
      this.prisma.supervisor.count({
        where: { usuario: { activo: true } },
      }),
    ]);

    return { total, activos, inactivos: total - activos };
  }
}

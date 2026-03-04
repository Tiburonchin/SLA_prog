import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearInspeccionDto, CerrarInspeccionDto, ActualizarChecklistDto } from './dto/inspeccion.dto';

@Injectable()
export class InspeccionesService {
  constructor(private prisma: PrismaService) {}

  private get includeCompleto() {
    return {
      supervisor: {
        select: {
          id: true,
          usuario: { select: { nombreCompleto: true } },
        },
      },
      sucursal: { select: { id: true, nombre: true } },
      fotos: true,
      trabajadores: {
        include: {
          trabajador: { select: { id: true, nombreCompleto: true, dni: true, cargo: true } },
        },
      },
    };
  }

  async obtenerTodas(filtros: { supervisorId?: string; sucursalId?: string; estado?: string; page?: string; limit?: string }) {
    const where: any = {};
    if (filtros.supervisorId) where.supervisorId = filtros.supervisorId;
    if (filtros.sucursalId) where.sucursalId = filtros.sucursalId;
    if (filtros.estado) where.estado = filtros.estado;

    const page = filtros.page ? parseInt(filtros.page, 10) : 1;
    const limit = filtros.limit ? parseInt(filtros.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [datos, total] = await Promise.all([
      this.prisma.inspeccion.findMany({
        where,
        orderBy: { creadoEn: 'desc' },
        include: this.includeCompleto,
        skip,
        take: limit,
      }),
      this.prisma.inspeccion.count({ where }),
    ]);

    return {
      datos,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async obtenerRecientes(limite: number = 5) {
    return this.prisma.inspeccion.findMany({
      take: limite,
      orderBy: { creadoEn: 'desc' },
      include: {
        supervisor: { select: { usuario: { select: { nombreCompleto: true } } } },
        sucursal: { select: { nombre: true } },
      },
    });
  }

  async obtenerPorId(id: string) {
    const inspeccion = await this.prisma.inspeccion.findUnique({
      where: { id },
      include: this.includeCompleto,
    });
    if (!inspeccion) throw new NotFoundException('Inspección no encontrada');
    return inspeccion;
  }

  async crear(usuario: any, dto: CrearInspeccionDto) {
    // SEC-06: IDOR - Validar que el originador corresponde al supervisorId si no es coordinador
    if (usuario.rol !== 'COORDINADOR') {
      const supervisorAutenticado = await this.prisma.supervisor.findFirst({ where: { usuarioId: usuario.id } });
      if (!supervisorAutenticado || supervisorAutenticado.id !== dto.supervisorId) {
        throw new BadRequestException('No puedes crear inspecciones a nombre de otro supervisor');
      }
    }

    // Validar supervisor y sucursal
    const [supervisor, sucursal] = await Promise.all([
      this.prisma.supervisor.findUnique({ where: { id: dto.supervisorId } }),
      this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } }),
    ]);
    if (!supervisor) throw new NotFoundException('Supervisor no encontrado');
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    // Crear inspección con checklist inicial (puede estar vacío)
    const inspeccion = await this.prisma.inspeccion.create({
      data: {
        supervisorId: dto.supervisorId,
        sucursalId: dto.sucursalId,
        ubicacion: dto.ubicacion,
        tipoTrabajo: dto.tipoTrabajo,
        checklist: JSON.parse(JSON.stringify(dto.checklist || [])) as any,
        observaciones: dto.observaciones,
        estado: 'EN_PROGRESO',
      },
      include: this.includeCompleto,
    });

    // Vincular trabajadores si se proporcionaron
    if (dto.trabajadorIds && dto.trabajadorIds.length > 0) {
      const dbWorkers = await this.prisma.trabajador.count({
        where: { id: { in: dto.trabajadorIds }, sucursalId: dto.sucursalId }
      });
      if (dbWorkers !== dto.trabajadorIds.length) {
        throw new BadRequestException('Uno o más trabajadores agregados no pertenecen a la sucursal indicada');
      }

      await this.prisma.inspeccionTrabajador.createMany({
        data: dto.trabajadorIds.map(tid => ({
          inspeccionId: inspeccion.id,
          trabajadorId: tid,
        })),
        skipDuplicates: true,
      });
    }

    return this.obtenerPorId(inspeccion.id);
  }

  async actualizarChecklist(usuario: any, id: string, dto: ActualizarChecklistDto) {
    const inspeccion = await this.prisma.inspeccion.findUnique({ where: { id } });
    if (!inspeccion) throw new NotFoundException('Inspección no encontrada');

    if (usuario.rol !== 'COORDINADOR') {
      const supervisorAutenticado = await this.prisma.supervisor.findFirst({ where: { usuarioId: usuario.id } });
      if (!supervisorAutenticado || inspeccion.supervisorId !== supervisorAutenticado.id) {
        throw new BadRequestException('No tienes permiso para modificar esta inspección');
      }
    }

    if (inspeccion.estado !== 'EN_PROGRESO') {
      throw new BadRequestException('Solo se pueden editar inspecciones en progreso');
    }

    return this.prisma.inspeccion.update({
      where: { id },
      data: {
        checklist: JSON.parse(JSON.stringify(dto.checklist)) as any,
        observaciones: dto.observaciones ?? inspeccion.observaciones,
      },
      include: this.includeCompleto,
    });
  }

  async cerrar(usuario: any, id: string, dto: CerrarInspeccionDto) {
    const inspeccion = await this.prisma.inspeccion.findUnique({ where: { id } });
    if (!inspeccion) throw new NotFoundException('Inspección no encontrada');

    if (usuario.rol !== 'COORDINADOR') {
      const supervisorAutenticado = await this.prisma.supervisor.findFirst({ where: { usuarioId: usuario.id } });
      if (!supervisorAutenticado || inspeccion.supervisorId !== supervisorAutenticado.id) {
        throw new BadRequestException('No tienes permiso para cerrar esta inspección');
      }
    }

    if (inspeccion.estado !== 'EN_PROGRESO') {
      throw new BadRequestException('La inspección ya está cerrada o cancelada');
    }

    return this.prisma.inspeccion.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        firmaSupervisor: true,
        latitudCierre: dto.latitudCierre,
        longitudCierre: dto.longitudCierre,
        fechaCierre: new Date(),
      },
      include: this.includeCompleto,
    });
  }

  async estadisticas() {
    const [total, enProgreso, completadas, canceladas] = await Promise.all([
      this.prisma.inspeccion.count(),
      this.prisma.inspeccion.count({ where: { estado: 'EN_PROGRESO' } }),
      this.prisma.inspeccion.count({ where: { estado: 'COMPLETADA' } }),
      this.prisma.inspeccion.count({ where: { estado: 'CANCELADA' } }),
    ]);
    return { total, enProgreso, completadas, canceladas };
  }

  async exportarCsv(): Promise<string> {
    const inspecciones = await this.prisma.inspeccion.findMany({
      orderBy: { creadoEn: 'desc' },
      include: this.includeCompleto,
    });

    let csv = '\ufeffTipo Trabajo,Ubicación,Estado,Sucursal,Supervisor,Fecha\n';
    for (const i of inspecciones) {
      const fecha = new Date(i.creadoEn).toLocaleDateString('es-MX', { timeZone: 'UTC' });
      csv += `"${i.tipoTrabajo}","${i.ubicacion}","${i.estado}","${i.sucursal?.nombre}","${i.supervisor?.usuario?.nombreCompleto}","${fecha}"\n`;
    }
    return csv;
  }
}

import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
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
      equipo: { select: { id: true, nombre: true, numeroSerie: true, estado: true, tipoEquipo: true } },
      fotos: true,
      trabajadores: {
        include: {
          trabajador: { select: { id: true, nombreCompleto: true, dni: true, cargo: true } },
        },
      },
    };
  }

  async obtenerTodas(filtros: { supervisorId?: string; sucursalId?: string; estado?: string; tipoInspeccion?: string; equipoId?: string; page?: string; limit?: string }) {
    const where: any = {};
    if (filtros.supervisorId) where.supervisorId = filtros.supervisorId;
    if (filtros.sucursalId) where.sucursalId = filtros.sucursalId;
    if (filtros.estado) where.estado = filtros.estado;
    if (filtros.tipoInspeccion) where.tipoInspeccion = filtros.tipoInspeccion;
    if (filtros.equipoId) where.equipoId = filtros.equipoId;

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
        equipo: { select: { id: true, nombre: true } },
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

  // ────────────────────────────────────────────────────────────────────────
  // REGLA HSE CRÍTICA 1: Bloqueo Pre-Uso — Autorización de Operador
  // ────────────────────────────────────────────────────────────────────────
  private async validarAutorizacionPreUso(equipoId: string, trabajadorIds: string[]) {
    if (!trabajadorIds || trabajadorIds.length === 0) return;

    for (const trabajadorId of trabajadorIds) {
      const autorizacion = await this.prisma.autorizacionOperador.findUnique({
        where: { trabajadorId_equipoId: { trabajadorId, equipoId } },
      });

      if (!autorizacion || autorizacion.estado !== 'AUTORIZADO') {
        const trabajador = await this.prisma.trabajador.findUnique({
          where: { id: trabajadorId },
          select: { nombreCompleto: true, dni: true },
        });
        throw new ForbiddenException(
          `ALERTA HSE: El trabajador ${trabajador?.nombreCompleto ?? ''} (${trabajador?.dni ?? trabajadorId}) no está capacitado/autorizado para operar este equipo.`,
        );
      }

      // Verificar que la autorización no esté vencida
      if (autorizacion.fechaVencimiento && autorizacion.fechaVencimiento < new Date()) {
        throw new ForbiddenException(
          'ALERTA HSE: La autorización del operador ha vencido. Debe renovarse antes de operar el equipo.',
        );
      }
    }
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

    const tipoInspeccion = dto.tipoInspeccion ?? 'GENERAL';

    // Validar coherencia: PRE_USO/PERIODICA/POST_INCIDENTE requieren equipoId
    if (tipoInspeccion !== 'GENERAL' && !dto.equipoId) {
      throw new BadRequestException(
        `Las inspecciones de tipo ${tipoInspeccion} requieren un equipoId vinculado.`,
      );
    }

    // Validar que el equipo existe si se proporcionó
    if (dto.equipoId) {
      const equipo = await this.prisma.equipo.findUnique({ where: { id: dto.equipoId } });
      if (!equipo) throw new NotFoundException('Equipo no encontrado');
    }

    // REGLA HSE 1: Verificar autorización del operador para PRE_USO
    if (tipoInspeccion === 'PRE_USO' && dto.equipoId && dto.trabajadorIds) {
      await this.validarAutorizacionPreUso(dto.equipoId, dto.trabajadorIds);
    }

    // Crear inspección
    const inspeccion = await this.prisma.inspeccion.create({
      data: {
        supervisorId: dto.supervisorId,
        sucursalId: dto.sucursalId,
        ubicacion: dto.ubicacion,
        tipoTrabajo: dto.tipoTrabajo,
        tipoInspeccion,
        equipoId: dto.equipoId,
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

  // ────────────────────────────────────────────────────────────────────────
  // REGLA HSE CRÍTICA 2: Baja automática de equipo al cerrar PRE_USO fallida
  // Si la inspección PRE_USO tiene ítems críticos reprobados →
  // el equipo pasa automáticamente a EN_MANTENIMIENTO.
  // ────────────────────────────────────────────────────────────────────────
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

    // REGLA HSE 2: Si es PRE_USO y hay ítems reprobados → equipo a EN_MANTENIMIENTO
    let equipoBajado = false;
    if (inspeccion.tipoInspeccion === 'PRE_USO' && inspeccion.equipoId) {
      const checklist = inspeccion.checklist as any[];
      const tieneReprobados = Array.isArray(checklist) && checklist.some(
        (item: any) => item.aprobado === false,
      );

      if (tieneReprobados) {
        await this.prisma.equipo.update({
          where: { id: inspeccion.equipoId },
          data: { estado: 'EN_MANTENIMIENTO' },
        });
        equipoBajado = true;
      }
    }

    const resultado = await this.prisma.inspeccion.update({
      where: { id },
      data: {
        estado: 'COMPLETADA',
        firmaSupervisor: !!dto.firmaBase64 || true,
        firmaBase64: dto.firmaBase64,
        latitudCierre: dto.latitudCierre,
        longitudCierre: dto.longitudCierre,
        fechaCierre: new Date(),
      },
      include: this.includeCompleto,
    });

    // Incluir bandera informativa en la respuesta
    return { ...resultado, equipoBajadoAutomaticamente: equipoBajado };
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

    let csv = '\ufeffTipo Inspección,Tipo Trabajo,Ubicación,Estado,Sucursal,Equipo,Supervisor,Fecha\n';
    for (const i of inspecciones) {
      const fecha = new Date(i.creadoEn).toLocaleDateString('es-MX', { timeZone: 'UTC' });
      const equipoNombre = i.equipo?.nombre ?? 'N/A';
      csv += `"${i.tipoInspeccion}","${i.tipoTrabajo}","${i.ubicacion}","${i.estado}","${i.sucursal?.nombre}","${equipoNombre}","${i.supervisor?.usuario?.nombreCompleto}","${fecha}"\n`;
    }
    return csv;
  }
}

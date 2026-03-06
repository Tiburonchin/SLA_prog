import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearAmonestacionDto, FiltrarAmonestacionesDto } from './dto/amonestacion.dto';
import { NotificacionesService } from '../notificaciones/notificaciones.service';

@Injectable()
export class AmonestacionesService {
  constructor(
    private prisma: PrismaService,
    private notificacionesService: NotificacionesService
  ) {}

  // Include reutilizable para obtener datos de supervisor con nombre
  private get includeCompleto() {
    return {
      trabajador: { select: { id: true, nombreCompleto: true, dni: true, cargo: true } },
      supervisor: {
        select: {
          id: true,
          usuario: { select: { nombreCompleto: true } },
        },
      },
      sucursal: { select: { id: true, nombre: true } },
      fotos: true,
    };
  }

  async obtenerTodas(filtros: FiltrarAmonestacionesDto) {
    const where: any = {};
    if (filtros.trabajadorId) where.trabajadorId = filtros.trabajadorId;
    if (filtros.supervisorId) where.supervisorId = filtros.supervisorId;
    if (filtros.sucursalId) where.sucursalId = filtros.sucursalId;
    if (filtros.severidad) where.severidad = filtros.severidad;

    const page = filtros.page ? parseInt(filtros.page, 10) : 1;
    const limit = filtros.limit ? parseInt(filtros.limit, 10) : 20;
    const skip = (page - 1) * limit;

    const [datos, total] = await Promise.all([
      this.prisma.amonestacion.findMany({
        where,
        orderBy: { fechaEvento: 'desc' },
        include: this.includeCompleto,
        skip,
        take: limit,
      }),
      this.prisma.amonestacion.count({ where }),
    ]);

    return {
      datos,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  async obtenerPorId(id: string) {
    const amonestacion = await this.prisma.amonestacion.findUnique({
      where: { id },
      include: this.includeCompleto,
    });
    if (!amonestacion) throw new NotFoundException('Amonestación no encontrada');
    return amonestacion;
  }

  async crear(usuario: any, dto: CrearAmonestacionDto) {
    // SEC-06: Validar originador
    if (usuario.rol !== 'COORDINADOR') {
      const supervisorAutenticado = await this.prisma.supervisor.findFirst({ where: { usuarioId: usuario.id } });
      if (!supervisorAutenticado || supervisorAutenticado.id !== dto.supervisorId) {
        throw new BadRequestException('No puedes registrar amonestaciones a nombre de otro supervisor');
      }
    }

    // Verificar existencias
    const [trabajador, supervisor, sucursal] = await Promise.all([
      this.prisma.trabajador.findUnique({ where: { id: dto.trabajadorId } }),
      this.prisma.supervisor.findUnique({ 
        where: { id: dto.supervisorId },
        include: { sucursales: true }
      }),
      this.prisma.sucursal.findUnique({ where: { id: dto.sucursalId } }),
    ]);
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado');
    if (!supervisor) throw new NotFoundException('Supervisor no encontrado');
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    const pertenece = supervisor.sucursales.some(s => s.sucursalId === sucursal.id);
    if (!pertenece) {
      throw new BadRequestException('El supervisor no está asignado a esta sucursal');
    }

    const amonestacion = await this.prisma.amonestacion.create({
      data: {
        trabajadorId: dto.trabajadorId,
        supervisorId: dto.supervisorId,
        sucursalId: dto.sucursalId,
        motivo: dto.motivo,
        severidad: dto.severidad,
        descripcion: dto.descripcion,
        testimonios: dto.testimonios,
        fechaEvento: new Date(dto.fechaEvento),
      },
      include: this.includeCompleto,
    });

    if (dto.severidad === 'GRAVE' || dto.severidad === 'CRITICA') {
      this.notificacionesService.emitirAlertaPush('alerta_critica', {
        mensaje: `Nueva amonestación ${dto.severidad} registrada`,
        amonestacion: {
          id: amonestacion.id,
          motivo: amonestacion.motivo,
          trabajador: amonestacion.trabajador.nombreCompleto,
          sucursal: amonestacion.sucursal.nombre
        }
      });
    }

    return amonestacion;
  }

  async estadisticas() {
    const [total, leves, graves, criticas] = await Promise.all([
      this.prisma.amonestacion.count(),
      this.prisma.amonestacion.count({ where: { severidad: 'LEVE' } }),
      this.prisma.amonestacion.count({ where: { severidad: 'GRAVE' } }),
      this.prisma.amonestacion.count({ where: { severidad: 'CRITICA' } }),
    ]);
    return { total, leves, graves, criticas };
  }

  async estadisticasPorSucursal() {
    const amonestaciones = await this.prisma.amonestacion.findMany({
      select: {
        severidad: true,
        sucursal: { select: { nombre: true } },
      },
    });

    const agrupado: Record<string, { leves: number; graves: number; criticas: number }> = {};
    amonestaciones.forEach(a => {
      const nombre = a.sucursal.nombre;
      if (!agrupado[nombre]) agrupado[nombre] = { leves: 0, graves: 0, criticas: 0 };
      if (a.severidad === 'LEVE') agrupado[nombre].leves++;
      else if (a.severidad === 'GRAVE') agrupado[nombre].graves++;
      else agrupado[nombre].criticas++;
    });

    return Object.entries(agrupado).map(([sucursal, data]) => ({
      sucursal,
      ...data,
      total: data.leves + data.graves + data.criticas,
    }));
  }

  async exportarCsv(): Promise<string> {
    const amonestaciones = await this.prisma.amonestacion.findMany({
      orderBy: { fechaEvento: 'desc' },
      include: this.includeCompleto,
    });

    let csv = '\ufeffTrabajador,DNI,Motivo,Severidad,Sucursal,Fecha\n';
    for (const a of amonestaciones) {
      const fecha = new Date(a.fechaEvento).toLocaleDateString('es-MX', { timeZone: 'UTC' });
      csv += `"${a.trabajador?.nombreCompleto}","${a.trabajador?.dni}","${a.motivo}","${a.severidad}","${a.sucursal?.nombre}","${fecha}"\n`;
    }
    return csv;
  }
}

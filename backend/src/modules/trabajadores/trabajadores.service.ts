import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearTrabajadorDto, ActualizarTrabajadorDto } from './dto/trabajador.dto';
import { CrearEntregaEppDto } from './dto/trabajador-epp.dto';
import { CrearCapacitacionDto } from './dto/trabajador-cap.dto';

@Injectable()
export class TrabajadoresService {
  constructor(private prisma: PrismaService) {}

  // Obtener todos los trabajadores activos con su sucursal (PAGINADO)
  async obtenerTodos(busqueda?: string, sucursalId?: string, page: number = 1, limit: number = 20) {
    const where: any = { activo: true };

    if (busqueda) {
      where.OR = [
        { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
        { dni: { contains: busqueda } },
        { cargo: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const skip = (page - 1) * limit;
    const [datos, total] = await Promise.all([
      this.prisma.trabajador.findMany({
        where,
        include: {
          sucursal: { select: { id: true, nombre: true } },
        },
        orderBy: { nombreCompleto: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.trabajador.count({ where }),
    ]);

    return {
      datos,
      total,
      pagina: page,
      limite: limit,
      totalPaginas: Math.ceil(total / limit),
    };
  }

  // Obtener un trabajador con su perfil 360°
  async obtenerPorId(id: string) {
    const trabajador = await this.prisma.trabajador.findUnique({
      where: { id },
      include: {
        sucursal: true,
        entregasEpp: { orderBy: { fechaEntrega: 'desc' }, take: 10 },
        capacitaciones: { orderBy: { fechaRealizacion: 'desc' }, take: 10 },
        amonestaciones: {
          orderBy: { fechaEvento: 'desc' },
          take: 5,
          include: { supervisor: { include: { usuario: { select: { nombreCompleto: true } } } } },
        },
        inspecciones: {
          take: 5,
          include: { inspeccion: { select: { id: true, tipoTrabajo: true, estado: true, creadoEn: true } } },
        },
      },
    });

    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return trabajador;
  }

  // Buscar trabajador por código QR
  async obtenerPorQr(codigoQr: string) {
    const trabajador = await this.prisma.trabajador.findUnique({
      where: { codigoQr },
      select: { id: true }
    });
    
    if (!trabajador) {
      throw new NotFoundException('Código QR no asociado a ningún trabajador');
    }
    return trabajador;
  }

  // Crear un nuevo trabajador
  async crear(dto: CrearTrabajadorDto) {
    // Verificar que el DNI no exista
    const existente = await this.prisma.trabajador.findUnique({
      where: { dni: dto.dni },
    });

    if (existente) {
      throw new ConflictException('Ya existe un trabajador con ese DNI');
    }

    return this.prisma.trabajador.create({
      data: {
        ...dto,
        codigoQr: `HSE-${dto.dni}-${Date.now()}`,
      },
      include: {
        sucursal: { select: { id: true, nombre: true } },
      },
    });
  }

  // Actualizar un trabajador
  async actualizar(id: string, dto: ActualizarTrabajadorDto) {
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id } });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return this.prisma.trabajador.update({
      where: { id },
      data: dto,
      include: {
        sucursal: { select: { id: true, nombre: true } },
      },
    });
  }

  // Desactivar un trabajador (soft delete)
  async desactivar(id: string) {
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id } });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return this.prisma.trabajador.update({
      where: { id },
      data: { activo: false },
    });
  }

  // Obtener estadísticas rápidas
  async estadisticas() {
    const [total, activos, porSucursal] = await Promise.all([
      this.prisma.trabajador.count(),
      this.prisma.trabajador.count({ where: { activo: true } }),
      this.prisma.trabajador.groupBy({
        by: ['sucursalId'],
        _count: true,
        where: { activo: true },
      }),
    ]);

    return { total, activos, inactivos: total - activos, porSucursal };
  }

  // Registrar Entrega EPP
  async registrarEntregaEpp(trabajadorId: string, dto: CrearEntregaEppDto) {
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id: trabajadorId } });
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado');

    return this.prisma.entregaEpp.create({
      data: {
        trabajadorId,
        tipoEpp: dto.tipoEpp,
        marca: dto.marca,
        talla: dto.talla,
        fechaEntrega: new Date(dto.fechaEntrega),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        observaciones: dto.observaciones,
      }
    });
  }

  // Registrar Capacitacion
  async registrarCapacitacion(trabajadorId: string, dto: CrearCapacitacionDto) {
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id: trabajadorId } });
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado');

    return this.prisma.capacitacion.create({
      data: {
        trabajadorId,
        nombreCurso: dto.nombreCurso,
        institucion: dto.institucion,
        fechaRealizacion: new Date(dto.fechaRealizacion),
        fechaVencimiento: dto.fechaVencimiento ? new Date(dto.fechaVencimiento) : null,
        certificadoUrl: dto.certificadoUrl,
        vigente: true,
      }
    });
  }
}

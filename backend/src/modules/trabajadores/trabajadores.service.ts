import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearTrabajadorDto, ActualizarTrabajadorDto } from './dto/trabajador.dto';
import { CrearEntregaEppDto } from './dto/trabajador-epp.dto';
import { CrearCapacitacionDto } from './dto/trabajador-cap.dto';

@Injectable()
export class TrabajadoresService {
  constructor(private prisma: PrismaService) {}

  // Validación de jurisdicción para supervisores
  private async validarJurisdiccion(usuario: any, sucursalIdDeseada?: string | null): Promise<string[] | undefined> {
    if (usuario.rol !== 'SUPERVISOR') return undefined; // No restringe a COORDINADOR o JEFATURA
    
    // Obtener las sucursales asignadas al supervisor
    const supervisor = await this.prisma.supervisor.findUnique({
      where: { usuarioId: usuario.id },
      include: { sucursales: true }
    });

    if (!supervisor || supervisor.sucursales.length === 0) {
      throw new ForbiddenException('No tiene sucursales asignadas');
    }

    const susSucursalesIds = supervisor.sucursales.map(s => s.sucursalId);

    if (sucursalIdDeseada && !susSucursalesIds.includes(sucursalIdDeseada)) {
      throw new ForbiddenException('No tiene jurisdicción sobre esta sucursal');
    }

    return susSucursalesIds;
  }
  
  private async verificarAccesoTrabajador(usuario: any, trabajadorId: string) {
    if (usuario.rol !== 'SUPERVISOR') return;
    
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id: trabajadorId }, select: { sucursalId: true } });
    if (!trabajador) throw new NotFoundException('Trabajador no encontrado');
    
    await this.validarJurisdiccion(usuario, trabajador.sucursalId);
  }

  // Obtener todos los trabajadores activos con su sucursal (PAGINADO)
  async obtenerTodos(usuario: any, busqueda?: string, sucursalId?: string, page: number = 1, limit: number = 20) {
    const where: any = { estadoLaboral: 'ACTIVO' };
    
    const sucursalesPermitidas = await this.validarJurisdiccion(usuario, sucursalId);

    if (busqueda) {
      where.OR = [
        { nombreCompleto: { contains: busqueda, mode: 'insensitive' } },
        { dni: { contains: busqueda } },
        { cargo: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (sucursalesPermitidas && !sucursalId) {
      where.sucursalId = { in: sucursalesPermitidas };
    } else if (sucursalId) {
      where.sucursalId = sucursalId;
    }

    const skip = (page - 1) * limit;
    const [datos, total] = await Promise.all([
      this.prisma.trabajador.findMany({
        where,
        include: {
          sucursal: { select: { id: true, nombre: true } },
          _count: { select: { entregasEpp: true, capacitaciones: true, amonestaciones: true, inspecciones: true } },
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
  async obtenerPorId(usuario: any, id: string) {
    await this.verificarAccesoTrabajador(usuario, id);
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

  // Obtener datos médicos de emergencia optimizados
  async obtenerEmergencia(usuario: any, id: string) {
    await this.verificarAccesoTrabajador(usuario, id);
    const trabajador = await this.prisma.trabajador.findUnique({
      where: { id },
      select: {
        id: true,
        nombreCompleto: true,
        dni: true,
        tipoSangre: true,
        contactoEmergencia: true,
        telefonoEmergencia: true,
        estadoEMO: true,
        fechaVencimientoEMO: true,
        estadoLaboral: true,
        alergiasCriticas: true,
        condicionesPreexistentes: true,
        eps: true,
        arl: true,
        fechaUltimoExamen: true,
        capacitaciones: {
          where: { nombreCurso: { contains: 'auxilios', mode: 'insensitive' }, vigente: true },
          select: { nombreCurso: true, fechaVencimiento: true }
        }
      }
    });

    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    return trabajador;
  }

  // Buscar trabajador por código QR
  async obtenerPorQr(usuario: any, codigoQr: string) {
    const trabajador = await this.prisma.trabajador.findUnique({
      where: { codigoQr },
      select: { id: true, sucursalId: true }
    });
    
    if (!trabajador) {
      throw new NotFoundException('Código QR no asociado a ningún trabajador');
    }
    
    await this.validarJurisdiccion(usuario, trabajador.sucursalId);
    
    return { id: trabajador.id };
  }

  // Crear un nuevo trabajador
  async crear(usuario: any, dto: CrearTrabajadorDto) {
    await this.validarJurisdiccion(usuario, dto.sucursalId);
    // Verificar que el DNI no exista
    const existente = await this.prisma.trabajador.findUnique({
      where: { dni: dto.dni },
    });

    if (existente) {
      throw new ConflictException('Ya existe un trabajador con ese DNI');
    }

    const { fotoBase64, fechaUltimoExamen, fechaIngreso, fechaNacimiento, fechaVencimientoEMO, ...restDto } = dto;

    return this.prisma.trabajador.create({
      data: {
        ...restDto,
        fotoUrl: fotoBase64,
        fechaUltimoExamen: fechaUltimoExamen ? new Date(fechaUltimoExamen) : undefined,
        fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : undefined,
        fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : undefined,
        fechaVencimientoEMO: fechaVencimientoEMO ? new Date(fechaVencimientoEMO) : undefined,
        codigoQr: `HSE-${dto.dni}-${Date.now()}`,
      },
      include: {
        sucursal: { select: { id: true, nombre: true } },
      },
    });
  }

  // Actualizar un trabajador
  async actualizar(usuario: any, id: string, dto: ActualizarTrabajadorDto) {
    await this.verificarAccesoTrabajador(usuario, id);
    if (dto.sucursalId) await this.validarJurisdiccion(usuario, dto.sucursalId);
    const trabajador = await this.prisma.trabajador.findUnique({ where: { id } });
    if (!trabajador) {
      throw new NotFoundException('Trabajador no encontrado');
    }

    const { fotoBase64, fechaUltimoExamen, fechaIngreso, fechaNacimiento, fechaVencimientoEMO, ...restDto } = dto;

    return this.prisma.trabajador.update({
      where: { id },
      data: {
        ...restDto,
        ...(fotoBase64 !== undefined && { fotoUrl: fotoBase64 }),
        ...(fechaUltimoExamen !== undefined && { fechaUltimoExamen: fechaUltimoExamen ? new Date(fechaUltimoExamen) : null }),
        ...(fechaIngreso !== undefined && { fechaIngreso: fechaIngreso ? new Date(fechaIngreso) : null }),
        ...(fechaNacimiento !== undefined && { fechaNacimiento: fechaNacimiento ? new Date(fechaNacimiento) : null }),
        ...(fechaVencimientoEMO !== undefined && { fechaVencimientoEMO: fechaVencimientoEMO ? new Date(fechaVencimientoEMO) : null }),
      },
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



  // Registrar Entrega EPP
  async registrarEntregaEpp(usuario: any, trabajadorId: string, dto: CrearEntregaEppDto) {
    await this.verificarAccesoTrabajador(usuario, trabajadorId);
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
  async registrarCapacitacion(usuario: any, trabajadorId: string, dto: CrearCapacitacionDto) {
    await this.verificarAccesoTrabajador(usuario, trabajadorId);
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

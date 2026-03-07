import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearEquipoDto, ActualizarEquipoDto, CrearCalibracionDto } from './dto/equipo.dto';

@Injectable()
export class EquiposService {
  constructor(private prisma: PrismaService) {}

  // Listar todos los equipos con última calibración
  async obtenerTodos(busqueda?: string, estado?: string) {
    const where: any = {};

    if (busqueda) {
      where.OR = [
        { nombre: { contains: busqueda, mode: 'insensitive' } },
        { numeroSerie: { contains: busqueda } },
        { marca: { contains: busqueda, mode: 'insensitive' } },
      ];
    }

    if (estado) {
      where.estado = estado;
    }

    return this.prisma.equipo.findMany({
      where,
      include: {
        sucursal: { select: { id: true, nombre: true } },
        calibraciones: {
          orderBy: { proximaCalibracion: 'desc' },
          take: 1,
        },
        _count: { select: { calibraciones: true, mantenimientos: true, autorizaciones: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Detalle de equipo con historial completo
  async obtenerPorId(id: string) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
      include: {
        sucursal: { select: { id: true, nombre: true } },
        calibraciones: { orderBy: { fechaCalibracion: 'desc' } },
        mantenimientos: { orderBy: { fechaMantenimiento: 'desc' }, take: 10 },
        autorizaciones: {
          include: { trabajador: { select: { id: true, nombreCompleto: true, dni: true } } },
          orderBy: { creadoEn: 'desc' },
        },
      },
    });

    if (!equipo) throw new NotFoundException('Equipo no encontrado');
    return equipo;
  }

  // Buscar equipo por tag NFC
  async obtenerPorNfc(nfcTagId: string) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { nfcTagId },
      include: {
        sucursal: { select: { id: true, nombre: true } },
        calibraciones: { orderBy: { fechaCalibracion: 'desc' } },
      },
    });

    if (!equipo) throw new NotFoundException('Equipo no encontrado o Tag NFC no registrado');
    return equipo;
  }

  // Crear equipo con campos expandidos
  async crear(dto: CrearEquipoDto) {
    const existente = await this.prisma.equipo.findUnique({ where: { numeroSerie: dto.numeroSerie } });
    if (existente) throw new ConflictException('Ya existe un equipo con ese número de serie');

    return this.prisma.equipo.create({
      data: {
        nombre: dto.nombre,
        numeroSerie: dto.numeroSerie,
        marca: dto.marca,
        modelo: dto.modelo,
        estado: dto.estado,
        descripcion: dto.descripcion,
        nfcTagId: dto.nfcTagId,
        sucursalId: dto.sucursalId,
        ubicacionFisica: dto.ubicacionFisica,
        tipoEquipo: dto.tipoEquipo,
        fechaFabricacion: dto.fechaFabricacion ? new Date(dto.fechaFabricacion) : undefined,
        fechaAdquisicion: dto.fechaAdquisicion ? new Date(dto.fechaAdquisicion) : undefined,
        vidaUtilMeses: dto.vidaUtilMeses,
        proximoMantenimiento: dto.proximoMantenimiento ? new Date(dto.proximoMantenimiento) : undefined,
        horasOperadasActuales: dto.horasOperadasActuales,
        horasLimiteMantenimiento: dto.horasLimiteMantenimiento,
        requiereLoto: dto.requiereLoto,
        puntosBloqueo: dto.puntosBloqueo,
        energiasPeligrosas: dto.energiasPeligrosas,
        eppObligatorio: dto.eppObligatorio,
      },
      include: { calibraciones: true, sucursal: { select: { id: true, nombre: true } } },
    });
  }

  // Actualizar equipo
  async actualizar(id: string, dto: ActualizarEquipoDto) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id } });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    const data: any = { ...dto };
    if (dto.fechaFabricacion) data.fechaFabricacion = new Date(dto.fechaFabricacion);
    if (dto.fechaAdquisicion) data.fechaAdquisicion = new Date(dto.fechaAdquisicion);
    if (dto.proximoMantenimiento) data.proximoMantenimiento = new Date(dto.proximoMantenimiento);

    return this.prisma.equipo.update({
      where: { id },
      data,
      include: {
        calibraciones: { orderBy: { fechaCalibracion: 'desc' }, take: 1 },
        sucursal: { select: { id: true, nombre: true } },
      },
    });
  }

  // Añadir una calibración al historial (con campos INACAL)
  async agregarCalibracion(dto: CrearCalibracionDto) {
    const equipo = await this.obtenerPorId(dto.equipoId);

    const fC = new Date(dto.fechaCalibracion);
    const pC = new Date(dto.proximaCalibracion);

    if (pC <= fC) {
      throw new BadRequestException('La próxima calibración debe ser posterior a la fecha de calibración');
    }

    return this.prisma.calibracion.create({
      data: {
        equipoId: equipo.id,
        fechaCalibracion: fC,
        proximaCalibracion: pC,
        certificadoUrl: dto.certificadoUrl,
        observaciones: dto.observaciones,
        entidadCertificadora: dto.entidadCertificadora,
        numeroCertificado: dto.numeroCertificado,
        estadoResultado: dto.estadoResultado,
      },
    });
  }

  // Equipos con calibración próxima a vencer (30 días)
  async calibracionesPorVencer() {
    const hoy = new Date();
    const en30Dias = new Date();
    en30Dias.setDate(en30Dias.getDate() + 30);

    const calibraciones = await this.prisma.calibracion.findMany({
      where: {
        proximaCalibracion: { gte: hoy, lte: en30Dias },
      },
      include: { equipo: true },
      orderBy: { proximaCalibracion: 'asc' },
    });

    return calibraciones;
  }

  // Dar de baja técnica
  async desactivar(id: string) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id } });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    return this.prisma.equipo.update({
      where: { id },
      data: { estado: 'BAJA_TECNICA' },
    });
  }
}

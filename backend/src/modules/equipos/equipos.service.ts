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
        calibraciones: {
          orderBy: { proximaCalibracion: 'desc' },
          take: 1,
        },
        _count: { select: { calibraciones: true } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  // Detalle de equipo con historial de calibraciones
  async obtenerPorId(id: string) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
      include: {
        calibraciones: { orderBy: { fechaCalibracion: 'desc' } },
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
        calibraciones: { orderBy: { fechaCalibracion: 'desc' } },
      },
    });

    if (!equipo) throw new NotFoundException('Equipo no encontrado o Tag NFC no registrado');
    return equipo;
  }

  // Crear equipo
  async crear(dto: CrearEquipoDto) {
    const existente = await this.prisma.equipo.findUnique({ where: { numeroSerie: dto.numeroSerie } });
    if (existente) throw new ConflictException('Ya existe un equipo con ese número de serie');

    return this.prisma.equipo.create({
      data: dto,
      include: { calibraciones: true },
    });
  }

  // Actualizar equipo
  async actualizar(id: string, dto: ActualizarEquipoDto) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id } });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    return this.prisma.equipo.update({
      where: { id },
      data: dto,
      include: { calibraciones: { orderBy: { fechaCalibracion: 'desc' }, take: 1 } },
    });
  }

  // Añadir una calibración al historial
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

import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearMantenimientoDto } from './dto/mantenimiento.dto';

@Injectable()
export class MantenimientosService {
  constructor(private prisma: PrismaService) {}

  async obtenerPorEquipo(equipoId: string) {
    return this.prisma.mantenimiento.findMany({
      where: { equipoId },
      orderBy: { fechaMantenimiento: 'desc' },
      include: { equipo: { select: { id: true, nombre: true, numeroSerie: true } } },
    });
  }

  async obtenerPorId(id: string) {
    const mantenimiento = await this.prisma.mantenimiento.findUnique({
      where: { id },
      include: { equipo: true },
    });
    if (!mantenimiento) throw new NotFoundException('Mantenimiento no encontrado');
    return mantenimiento;
  }

  // ────────────────────────────────────────────────────────────────────────
  // REGLA HSE CRÍTICA 3: Bloqueo LOTO
  // Si el equipo requiere LOTO, no se puede registrar un mantenimiento
  // sin una EjecucionLoto activa (estado = BLOQUEADO) para ese equipo.
  // ────────────────────────────────────────────────────────────────────────
  async crear(dto: CrearMantenimientoDto) {
    const equipo = await this.prisma.equipo.findUnique({ where: { id: dto.equipoId } });
    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    // REGLA LOTO: Verificar bloqueo activo antes de permitir mantenimiento
    if (equipo.requiereLoto) {
      const lotoActivo = await this.prisma.ejecucionLoto.findFirst({
        where: {
          equipoId: dto.equipoId,
          estadoEjecucion: 'BLOQUEADO',
        },
      });

      if (!lotoActivo) {
        throw new BadRequestException(
          'ALERTA LOTO: Este equipo requiere un procedimiento de Bloqueo y Etiquetado (LOTO) activo antes de realizar cualquier mantenimiento. Registre una EjecucionLoto en estado BLOQUEADO primero.',
        );
      }
    }

    const fechaMant = new Date(dto.fechaMantenimiento);
    const proximoMant = dto.proximoMantenimiento ? new Date(dto.proximoMantenimiento) : undefined;

    // Crear el registro de mantenimiento
    const mantenimiento = await this.prisma.mantenimiento.create({
      data: {
        equipoId: dto.equipoId,
        tipoMantenimiento: dto.tipoMantenimiento,
        fechaMantenimiento: fechaMant,
        proximoMantenimiento: proximoMant,
        tecnicoResponsable: dto.tecnicoResponsable,
        proveedorServicio: dto.proveedorServicio,
        trabajoRealizado: dto.trabajoRealizado,
        repuestosUsados: dto.repuestosUsados,
        horasEquipoAlMomento: dto.horasEquipoAlMomento,
        costoSoles: dto.costoSoles,
        equipoFueraServicio: dto.equipoFueraServicio,
        certificadoUrl: dto.certificadoUrl,
        observaciones: dto.observaciones,
      },
      include: { equipo: { select: { id: true, nombre: true, estado: true } } },
    });

    // Sincronizar próximo mantenimiento en el equipo si se proporcionó
    const equipoUpdate: any = {};
    if (proximoMant) equipoUpdate.proximoMantenimiento = proximoMant;
    if (dto.horasEquipoAlMomento != null) equipoUpdate.horasOperadasActuales = dto.horasEquipoAlMomento;
    if (dto.equipoFueraServicio) equipoUpdate.estado = 'EN_MANTENIMIENTO';

    if (Object.keys(equipoUpdate).length > 0) {
      await this.prisma.equipo.update({ where: { id: dto.equipoId }, data: equipoUpdate });
    }

    return mantenimiento;
  }
}

import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { IncidenteRapidoDto } from './dto/incidente-rapido.dto';

/**
 * IncidentesService
 *
 * Gestiona el ciclo de vida de los incidentes de seguridad laboral.
 * Implementa el reporte inmediato exigido por el Art. 82 de la Ley 29783
 * ("El empleador notificará al Ministerio de Trabajo y Promoción del Empleo
 * los accidentes de trabajo mortales y los incidentes peligrosos de inmediato").
 */
@Injectable()
export class IncidentesService {
  private readonly logger = new Logger(IncidentesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra un incidente rápido desde campo.
   *
   * El reporte rápido está optimizado para ser enviado en segundos:
   *   - Valida que el trabajador exista y esté activo
   *   - Genera la descripción interna combinando `tipo` + `descripcionBreve`
   *   - Fija `fechaEvento` al momento exacto del reporte (Art. 82 — inmediatez)
   *
   * @param dto      Tres campos mínimos: tipo, trabajadorId, descripcionBreve
   * @param usuarioId ID del usuario autenticado (para trazabilidad en logs)
   */
  async reporteRapido(dto: IncidenteRapidoDto, usuarioId: string) {
    // 1. Verificar que el trabajador existe y está activo
    const trabajador = await this.prisma.trabajador.findFirst({
      where: {
        id: dto.trabajadorId,
        deletedAt: null,
      },
      select: {
        id: true,
        nombreCompleto: true,
        cargo: true,
        activo: true,
        estadoLaboral: true,
        sucursal: { select: { nombre: true } },
      },
    });

    if (!trabajador) {
      throw new NotFoundException(
        `Trabajador con ID "${dto.trabajadorId}" no encontrado`,
      );
    }

    if (!trabajador.activo || trabajador.estadoLaboral === 'CESADO') {
      throw new BadRequestException(
        `El trabajador "${trabajador.nombreCompleto}" no está activo en el sistema. ` +
          'Verifique el estado laboral antes de registrar el incidente.',
      );
    }

    // 2. Construir descripción compuesta para almacenamiento
    //    Formato: "[REPORTE RÁPIDO | TIPO] descripcionBreve"
    //    El tipo queda indexado al inicio para búsquedas textuales futuras.
    const descripcionInterna = `[REPORTE RÁPIDO | ${dto.tipo}] ${dto.descripcionBreve.trim()}`;

    // 3. Crear el incidente — fechaEvento = NOW() garantiza inmediatez (Art. 82)
    const incidente = await this.prisma.incidente.create({
      data: {
        trabajadorId: dto.trabajadorId,
        descripcion: descripcionInterna,
        fechaEvento: new Date(),
        // ubicacion: null — se completa en la investigación posterior
        // amonestacionId: null — se vincula si el incidente genera sanción
      },
      select: {
        id: true,
        descripcion: true,
        fechaEvento: true,
        creadoEn: true,
        trabajador: {
          select: {
            id: true,
            nombreCompleto: true,
            cargo: true,
            sucursal: { select: { nombre: true } },
          },
        },
      },
    });

    this.logger.warn(
      `[Art.82 Ley29783] Incidente rápido registrado — ` +
        `Tipo: ${dto.tipo} | Trabajador: ${trabajador.nombreCompleto} | ` +
        `Sede: ${trabajador.sucursal.nombre} | ReportadoPor: ${usuarioId} | ` +
        `ID: ${incidente.id}`,
    );

    return {
      mensaje:
        'Incidente registrado exitosamente. Recuerde completar la investigación detallada a la brevedad.',
      referenciaLegal: 'Art. 82 Ley 29783 — Reporte inmediato de incidentes',
      incidente: {
        id: incidente.id,
        tipo: dto.tipo,
        descripcionBreve: dto.descripcionBreve,
        trabajador: incidente.trabajador,
        fechaEvento: incidente.fechaEvento,
        creadoEn: incidente.creadoEn,
      },
    };
  }
}

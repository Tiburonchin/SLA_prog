import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CrearSucursalDto, ActualizarSucursalDto } from './dto/sucursal.dto';

@Injectable()
export class SucursalesService {
  constructor(private prisma: PrismaService) {}

  async obtenerTodas() {
    return this.prisma.sucursal.findMany({
      where: { activa: true },
      orderBy: { nombre: 'asc' },
      include: {
        _count: { select: { trabajadores: true, inspecciones: true, amonestaciones: true, supervisores: true } },
      },
    });
  }

  async obtenerPorId(id: string) {
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
      include: {
        trabajadores: { where: { activo: true }, orderBy: { nombreCompleto: 'asc' } },
        // FIX: se agrega supervisores al _count para que PaginaDetalleSucursal
        // muestre el contador correcto (antes siempre retornaba 0).
        _count: { select: { trabajadores: true, inspecciones: true, amonestaciones: true, supervisores: true } },
      },
    });

    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');
    return sucursal;
  }

  async crear(dto: CrearSucursalDto) {
    const existente = await this.prisma.sucursal.findUnique({
      where: { nombre: dto.nombre },
    });

    if (existente) {
      throw new ConflictException('Ya existe una sucursal con este nombre');
    }

    const { brigadasEmergencia, peligrosIdentificados, ...rest } = dto;

    return this.prisma.sucursal.create({
      data: {
        ...rest,
        // JSON fields cast to Prisma.InputJsonValue to satisfy strict typing
        ...(brigadasEmergencia !== undefined && {
          brigadasEmergencia: brigadasEmergencia as unknown as Prisma.InputJsonValue,
        }),
        ...(peligrosIdentificados !== undefined && {
          peligrosIdentificados: peligrosIdentificados as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async actualizar(id: string, dto: ActualizarSucursalDto) {
    const sucursal = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    if (dto.nombre && dto.nombre !== sucursal.nombre) {
      const existente = await this.prisma.sucursal.findUnique({
        where: { nombre: dto.nombre },
      });
      if (existente) throw new ConflictException('Ya existe una sucursal con este nombre');
    }

    const { brigadasEmergencia, peligrosIdentificados, ...rest } = dto;

    return this.prisma.sucursal.update({
      where: { id },
      data: {
        ...rest,
        ...(brigadasEmergencia !== undefined && {
          brigadasEmergencia: brigadasEmergencia as unknown as Prisma.InputJsonValue,
        }),
        ...(peligrosIdentificados !== undefined && {
          peligrosIdentificados: peligrosIdentificados as unknown as Prisma.InputJsonValue,
        }),
      },
    });
  }

  async desactivar(id: string) {
    const sucursal = await this.prisma.sucursal.findUnique({
      where: { id },
      include: {
        _count: {
          select: { trabajadores: { where: { activo: true } } },
        },
      },
    });
    if (!sucursal) throw new NotFoundException('Sucursal no encontrada');

    if (sucursal._count.trabajadores > 0) {
      throw new BadRequestException('No se puede desactivar una sucursal con trabajadores activos');
    }

    return this.prisma.sucursal.update({
      where: { id },
      data: { activa: false },
    });
  }
}

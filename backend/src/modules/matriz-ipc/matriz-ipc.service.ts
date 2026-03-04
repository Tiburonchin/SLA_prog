import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CrearMatrizIpcDto, ActualizarMatrizIpcDto } from './dto/matriz-ipc.dto';

@Injectable()
export class MatrizIpcService {
  constructor(private prisma: PrismaService) {}

  async obtenerTodos() {
    return this.prisma.matrizIpc.findMany({
      where: { activo: true },
      orderBy: { cargo: 'asc' },
    });
  }

  async obtenerPorId(id: string) {
    const matriz = await this.prisma.matrizIpc.findUnique({ where: { id } });
    if (!matriz) throw new NotFoundException('Registro de Matriz IPC no encontrado');
    return matriz;
  }

  async crear(dto: CrearMatrizIpcDto) {
    const existente = await this.prisma.matrizIpc.findUnique({
      where: {
        cargo_ubicacion: {
          cargo: dto.cargo,
          ubicacion: dto.ubicacion,
        },
      },
    });

    if (existente) {
      throw new ConflictException('Ya existe un registro en la Matriz IPC para este cargo y ubicación');
    }

    return this.prisma.matrizIpc.create({
      data: {
        cargo: dto.cargo,
        ubicacion: dto.ubicacion,
        eppsObligatorios: dto.eppsObligatorios,
        herramientasRequeridas: dto.herramientasRequeridas,
        capacitacionesRequeridas: dto.capacitacionesRequeridas,
        descripcion: dto.descripcion,
      },
    });
  }

  async actualizar(id: string, dto: ActualizarMatrizIpcDto) {
    const matriz = await this.prisma.matrizIpc.findUnique({ where: { id } });
    if (!matriz) throw new NotFoundException('Registro de Matriz IPC no encontrado');

    // Si intenta cambiar cargo o ubicación, verificar duplicados
    if ((dto.cargo && dto.cargo !== matriz.cargo) || (dto.ubicacion && dto.ubicacion !== matriz.ubicacion)) {
      const existente = await this.prisma.matrizIpc.findUnique({
        where: {
          cargo_ubicacion: {
            cargo: dto.cargo || matriz.cargo,
            ubicacion: dto.ubicacion || matriz.ubicacion,
          },
        },
      });
      if (existente) throw new ConflictException('Ya existe un registro en la Matriz IPC para este cargo y ubicación');
    }

    // Prisma no soporta Json as undefined type strictly in some versions without helpers, 
    // pero Any es aceptado para JsonValue si usamos un cast, o evitamos enviar undefined properties.
    const dataToUpdate: any = {};
    if (dto.cargo !== undefined) dataToUpdate.cargo = dto.cargo;
    if (dto.ubicacion !== undefined) dataToUpdate.ubicacion = dto.ubicacion;
    if (dto.eppsObligatorios !== undefined) dataToUpdate.eppsObligatorios = dto.eppsObligatorios;
    if (dto.herramientasRequeridas !== undefined) dataToUpdate.herramientasRequeridas = dto.herramientasRequeridas;
    if (dto.capacitacionesRequeridas !== undefined) dataToUpdate.capacitacionesRequeridas = dto.capacitacionesRequeridas;
    if (dto.descripcion !== undefined) dataToUpdate.descripcion = dto.descripcion;
    if (dto.activo !== undefined) dataToUpdate.activo = dto.activo;

    return this.prisma.matrizIpc.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async desactivar(id: string) {
    const matriz = await this.prisma.matrizIpc.findUnique({ where: { id } });
    if (!matriz) throw new NotFoundException('Registro de Matriz IPC no encontrado');

    return this.prisma.matrizIpc.update({
      where: { id },
      data: { activo: false },
    });
  }
}

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoEquipo } from '@prisma/client';

export class CrearEquipoDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  numeroSerie: string;

  @IsOptional() @IsString()
  marca?: string;

  @IsOptional() @IsString()
  modelo?: string;

  @IsOptional() @IsEnum(EstadoEquipo)
  estado?: EstadoEquipo;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  nfcTagId?: string;
}

export class ActualizarEquipoDto {
  @IsOptional() @IsString()
  nombre?: string;

  @IsOptional() @IsString()
  marca?: string;

  @IsOptional() @IsString()
  modelo?: string;

  @IsOptional() @IsEnum(EstadoEquipo)
  estado?: EstadoEquipo;

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsString()
  nfcTagId?: string;
}

export class CrearCalibracionDto {
  @IsUUID()
  equipoId: string;

  @IsDateString()
  fechaCalibracion: string;

  @IsDateString()
  proximaCalibracion: string;

  @IsOptional() @IsString()
  certificadoUrl?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}

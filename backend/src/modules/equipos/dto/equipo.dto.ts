import {
  IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString,
  IsUUID, IsBoolean, IsInt, IsNumber, IsArray,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoEquipo, TipoEquipo, EstadoCalibracion } from '@prisma/client';

// ===== EQUIPO =====

export class CrearEquipoDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  nombre: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  numeroSerie: string;

  @IsOptional() @IsString() marca?: string;
  @IsOptional() @IsString() modelo?: string;
  @IsOptional() @IsEnum(EstadoEquipo) estado?: EstadoEquipo;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() nfcTagId?: string;

  // Sinergia — Ubicación
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsString() ubicacionFisica?: string;

  // Ciclo de Vida
  @IsOptional() @IsEnum(TipoEquipo) tipoEquipo?: TipoEquipo;
  @IsOptional() @IsDateString() fechaFabricacion?: string;
  @IsOptional() @IsDateString() fechaAdquisicion?: string;
  @IsOptional() @IsInt() vidaUtilMeses?: number;
  @IsOptional() @IsDateString() proximoMantenimiento?: string;
  @IsOptional() @IsNumber() horasOperadasActuales?: number;
  @IsOptional() @IsNumber() horasLimiteMantenimiento?: number;

  // LOTO
  @IsOptional() @IsBoolean() requiereLoto?: boolean;
  @IsOptional() @IsString() puntosBloqueo?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) energiasPeligrosas?: string[];

  // EPP por máquina (JSONB)
  @IsOptional() eppObligatorio?: any;

  // Responsable HSE y datos técnicos legales (DS 005-2012-TR Art. 26 / DS 042-F)
  @IsOptional() @IsString() coordinadorResponsable?: string;
  @IsOptional() @IsString() telefonoEmergenciaCoordinador?: string;
  @IsOptional() @IsString() capacidadNominalPresion?: string;
}

export class ActualizarEquipoDto {
  @IsOptional() @IsString() nombre?: string;
  @IsOptional() @IsString() marca?: string;
  @IsOptional() @IsString() modelo?: string;
  @IsOptional() @IsEnum(EstadoEquipo) estado?: EstadoEquipo;
  @IsOptional() @IsString() descripcion?: string;
  @IsOptional() @IsString() nfcTagId?: string;

  // Sinergia
  @IsOptional() @IsUUID() sucursalId?: string;
  @IsOptional() @IsString() ubicacionFisica?: string;

  // Ciclo de Vida
  @IsOptional() @IsEnum(TipoEquipo) tipoEquipo?: TipoEquipo;
  @IsOptional() @IsDateString() fechaFabricacion?: string;
  @IsOptional() @IsDateString() fechaAdquisicion?: string;
  @IsOptional() @IsInt() vidaUtilMeses?: number;
  @IsOptional() @IsDateString() proximoMantenimiento?: string;
  @IsOptional() @IsNumber() horasOperadasActuales?: number;
  @IsOptional() @IsNumber() horasLimiteMantenimiento?: number;

  // LOTO
  @IsOptional() @IsBoolean() requiereLoto?: boolean;
  @IsOptional() @IsString() puntosBloqueo?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) energiasPeligrosas?: string[];

  // EPP por máquina (JSONB)
  @IsOptional() eppObligatorio?: any;

  // Responsable HSE y datos técnicos legales (DS 005-2012-TR Art. 26 / DS 042-F)
  @IsOptional() @IsString() coordinadorResponsable?: string;
  @IsOptional() @IsString() telefonoEmergenciaCoordinador?: string;
  @IsOptional() @IsString() capacidadNominalPresion?: string;
}

// ===== CALIBRACIÓN =====

export class CrearCalibracionDto {
  @IsUUID()
  equipoId: string;

  @IsDateString()
  fechaCalibracion: string;

  @IsDateString()
  proximaCalibracion: string;

  @IsOptional() @IsString() certificadoUrl?: string;
  @IsOptional() @IsString() observaciones?: string;

  // Campos INACAL
  @IsOptional() @IsString() entidadCertificadora?: string;
  @IsOptional() @IsString() numeroCertificado?: string;
  @IsOptional() @IsEnum(EstadoCalibracion) estadoResultado?: EstadoCalibracion;
  // NTP-ISO/IEC 17025: N° de acreditación del laboratorio ante INACAL (ej: "LE-038")
  @IsOptional() @IsString() numeroAcreditacionInacal?: string;
}

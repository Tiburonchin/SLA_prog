import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  IsArray,
  ValidateNested,
  Min,
  Max,
  IsPhoneNumber,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  TipoInstalacion,
  NivelRiesgo,
  CategoriaIncendio,
  ResultadoInspeccionSUNAFIL,
} from '@prisma/client';

// ─── Nested DTOs para campos JSONB ────────────────────────────────────────────

/**
 * Representa una brigada de emergencia dentro del array `brigadasEmergencia`.
 * Ejemplo: {"tipo":"Evacuación","jefe":"Juan Pérez","miembros":4,"certificado":true}
 */
export class BrigadaEmergenciaDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  jefe: string;

  @IsInt()
  @Min(0)
  miembros: number;

  @IsBoolean()
  certificado: boolean;
}

/**
 * Representa un peligro identificado dentro del array `peligrosIdentificados`.
 * Ejemplo: {"tipo":"Eléctrico","nivel":"ALTO","zona":"Sala de servidores","control":"Extintores CO2"}
 */
export class PeligroIdentificadoDto {
  @IsString()
  @IsNotEmpty()
  tipo: string;

  @IsString()
  @IsNotEmpty()
  nivel: string;

  @IsString()
  @IsNotEmpty()
  zona: string;

  @IsString()
  @IsNotEmpty()
  control: string;
}

// ─── CreateSucursalDto ─────────────────────────────────────────────────────────

export class CrearSucursalDto {
  // ── Campos base ──────────────────────────────────────────────────────────────
  @IsString()
  @IsNotEmpty()
  nombre: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;

  // ── Clasificación INDECI / Ley 29783 ─────────────────────────────────────────
  @IsEnum(TipoInstalacion)
  @IsOptional()
  tipoInstalacion?: TipoInstalacion;

  @IsEnum(NivelRiesgo)
  @IsOptional()
  nivelRiesgo?: NivelRiesgo;

  @IsEnum(CategoriaIncendio)
  @IsOptional()
  categoriaIncendio?: CategoriaIncendio;

  // ── Datos legales y registros obligatorios ────────────────────────────────────
  @IsString()
  @IsOptional()
  codigoCIIU?: string;

  @IsString()
  @IsOptional()
  codigoEstablecimientoINDECI?: string;

  @IsString()
  @IsOptional()
  numeroCertificadoDC?: string;

  /** ISO 8601: "2026-12-31T00:00:00.000Z" */
  @IsDateString()
  @IsOptional()
  vencimientoCertificadoDC?: string;

  @IsDateString()
  @IsOptional()
  fechaProximaRevisionDC?: string;

  // ── Infraestructura física ────────────────────────────────────────────────────
  @IsInt()
  @Min(1)
  @IsOptional()
  aforoMaximo?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  areaM2?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  numeroPisos?: number;

  @IsInt()
  @Min(1900)
  @IsOptional()
  anioConstruccion?: number;

  /** Zona sísmica según NTE E.030: valores 1, 2, 3 o 4 */
  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  zonaRiesgoSismico?: number;

  // ── Gestión de emergencias (Ley 29783 Art. 34) ───────────────────────────────
  @IsString()
  @IsOptional()
  responsableSSTNombre?: string;

  @IsString()
  @IsOptional()
  responsableSSTTelefono?: string;

  @IsString()
  @IsOptional()
  medicoOcupacionalNombre?: string;

  @IsString()
  @IsOptional()
  centroMedicoMasCercano?: string;

  @IsString()
  @IsOptional()
  telefonoCentroMedico?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadExtintores?: number;

  @IsBoolean()
  @IsOptional()
  tieneDesfibriladorDEA?: boolean;

  @IsString()
  @IsOptional()
  ubicacionDEA?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadBotiquines?: number;

  @IsBoolean()
  @IsOptional()
  tieneEnfermeria?: boolean;

  @IsString()
  @IsOptional()
  telefonoEmergenciasSede?: string;

  // ── Plan de emergencia y simulacros ──────────────────────────────────────────
  @IsBoolean()
  @IsOptional()
  planEmergenciaVigente?: boolean;

  @IsDateString()
  @IsOptional()
  fechaVencimientoPlanEmergencia?: string;

  @IsDateString()
  @IsOptional()
  fechaUltimoSimulacro?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadSimulacrosAnio?: number;

  // ── Brigadas y peligros (JSONB) ───────────────────────────────────────────────
  /** Array de brigadas de emergencia. Ver BrigadaEmergenciaDto para estructura. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrigadaEmergenciaDto)
  @IsOptional()
  brigadasEmergencia?: BrigadaEmergenciaDto[];

  /** Array de peligros identificados por zona. Ver PeligroIdentificadoDto para estructura. */
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeligroIdentificadoDto)
  @IsOptional()
  peligrosIdentificados?: PeligroIdentificadoDto[];

  // ── Trazabilidad SUNAFIL ──────────────────────────────────────────────────────
  @IsDateString()
  @IsOptional()
  fechaUltimaInspeccionSUNAFIL?: string;

  @IsEnum(ResultadoInspeccionSUNAFIL)
  @IsOptional()
  resultadoUltimaInspeccion?: ResultadoInspeccionSUNAFIL;

  @IsString()
  @IsOptional()
  observacionesLegalesActivas?: string;
}

// ─── UpdateSucursalDto ────────────────────────────────────────────────────────
// Todos los campos opcionales (patch semántico)

export class ActualizarSucursalDto {
  // ── Campos base ──────────────────────────────────────────────────────────────
  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  direccion?: string;

  @IsNumber()
  @IsOptional()
  latitud?: number;

  @IsNumber()
  @IsOptional()
  longitud?: number;

  // ── Clasificación INDECI / Ley 29783 ─────────────────────────────────────────
  @IsEnum(TipoInstalacion)
  @IsOptional()
  tipoInstalacion?: TipoInstalacion;

  @IsEnum(NivelRiesgo)
  @IsOptional()
  nivelRiesgo?: NivelRiesgo;

  @IsEnum(CategoriaIncendio)
  @IsOptional()
  categoriaIncendio?: CategoriaIncendio;

  // ── Datos legales y registros obligatorios ────────────────────────────────────
  @IsString()
  @IsOptional()
  codigoCIIU?: string;

  @IsString()
  @IsOptional()
  codigoEstablecimientoINDECI?: string;

  @IsString()
  @IsOptional()
  numeroCertificadoDC?: string;

  @IsDateString()
  @IsOptional()
  vencimientoCertificadoDC?: string;

  @IsDateString()
  @IsOptional()
  fechaProximaRevisionDC?: string;

  // ── Infraestructura física ────────────────────────────────────────────────────
  @IsInt()
  @Min(1)
  @IsOptional()
  aforoMaximo?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  areaM2?: number;

  @IsInt()
  @Min(1)
  @IsOptional()
  numeroPisos?: number;

  @IsInt()
  @Min(1900)
  @IsOptional()
  anioConstruccion?: number;

  @IsInt()
  @Min(1)
  @Max(4)
  @IsOptional()
  zonaRiesgoSismico?: number;

  // ── Gestión de emergencias (Ley 29783 Art. 34) ───────────────────────────────
  @IsString()
  @IsOptional()
  responsableSSTNombre?: string;

  @IsString()
  @IsOptional()
  responsableSSTTelefono?: string;

  @IsString()
  @IsOptional()
  medicoOcupacionalNombre?: string;

  @IsString()
  @IsOptional()
  centroMedicoMasCercano?: string;

  @IsString()
  @IsOptional()
  telefonoCentroMedico?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadExtintores?: number;

  @IsBoolean()
  @IsOptional()
  tieneDesfibriladorDEA?: boolean;

  @IsString()
  @IsOptional()
  ubicacionDEA?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadBotiquines?: number;

  @IsBoolean()
  @IsOptional()
  tieneEnfermeria?: boolean;

  @IsString()
  @IsOptional()
  telefonoEmergenciasSede?: string;

  // ── Plan de emergencia y simulacros ──────────────────────────────────────────
  @IsBoolean()
  @IsOptional()
  planEmergenciaVigente?: boolean;

  @IsDateString()
  @IsOptional()
  fechaVencimientoPlanEmergencia?: string;

  @IsDateString()
  @IsOptional()
  fechaUltimoSimulacro?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  cantidadSimulacrosAnio?: number;

  // ── Brigadas y peligros (JSONB) ───────────────────────────────────────────────
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BrigadaEmergenciaDto)
  @IsOptional()
  brigadasEmergencia?: BrigadaEmergenciaDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PeligroIdentificadoDto)
  @IsOptional()
  peligrosIdentificados?: PeligroIdentificadoDto[];

  // ── Trazabilidad SUNAFIL ──────────────────────────────────────────────────────
  @IsDateString()
  @IsOptional()
  fechaUltimaInspeccionSUNAFIL?: string;

  @IsEnum(ResultadoInspeccionSUNAFIL)
  @IsOptional()
  resultadoUltimaInspeccion?: ResultadoInspeccionSUNAFIL;

  @IsString()
  @IsOptional()
  observacionesLegalesActivas?: string;
}

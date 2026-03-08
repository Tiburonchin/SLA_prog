import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsEnum, IsDateString, IsBoolean, IsNumber, IsUrl,
  ValidateIf,
} from 'class-validator';
import { TipoMantenimiento } from '@prisma/client';

export class CrearMantenimientoDto {
  @IsUUID()
  equipoId: string;

  @IsEnum(TipoMantenimiento)
  tipoMantenimiento: TipoMantenimiento;

  @IsDateString()
  fechaMantenimiento: string;

  @IsOptional() @IsDateString()
  proximoMantenimiento?: string;

  @IsString() @IsNotEmpty()
  tecnicoResponsable: string;

  @IsOptional() @IsString()
  proveedorServicio?: string;

  @IsString() @IsNotEmpty()
  trabajoRealizado: string;

  @IsOptional() @IsString()
  repuestosUsados?: string;

  @IsOptional() @IsNumber()
  horasEquipoAlMomento?: number;

  @IsOptional() @IsNumber()
  costoSoles?: number;

  @IsOptional() @IsBoolean()
  equipoFueraServicio?: boolean;

  // El equipo quedó operativo al finalizar la intervención
  @IsOptional() @IsBoolean()
  equipoQuedoOperativo?: boolean;

  // OBLIGATORIO: Orden de trabajo firmada o informe técnico (DS 005-2012-TR Art. 26)
  // Debe ser una URL válida al archivo subido (S3, Blob, etc.)
  @IsString() @IsNotEmpty()
  certificadoUrl: string;

  @IsOptional() @IsString()
  observaciones?: string;

  // ===== CAMPOS HSE LEGALES — OBLIGATORIOS –––––––––––––––––––––––––––––––

  // OSHA 1910.147: ¿Se aplicó protocolo LOTO?
  // ValidateIf: el valor es OBLIGATORIO si el equipo requiere LOTO (verificado en el service)
  @IsBoolean()
  aplicoLoto: boolean;

  // Ley 29783 Art. 82: ¿La falla que originó el correctivo causó incidente/accidente?
  @IsBoolean()
  generoIncidente: boolean;

  // DS 005-2012-TR: FK al Incidente vinculado. Requerido si generoIncidente=true
  @ValidateIf((o) => o.generoIncidente === true)
  @IsUUID()
  incidenteId?: string;

  // DS 024-2016-EM: Certificación del técnico para este tipo de intervención
  @IsOptional() @IsString()
  certificacionTecnico?: string;

  // ISO 14001:2015 Cláusula 8.1: ¿Cómo se dispuso de residuos peligrosos generados?
  @IsString() @IsNotEmpty()
  disposicionResiduos: string;
}

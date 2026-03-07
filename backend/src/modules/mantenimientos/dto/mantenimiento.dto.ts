import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsEnum, IsDateString, IsBoolean, IsNumber,
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

  @IsOptional() @IsString()
  certificadoUrl?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}

import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

export enum EstadoInspeccion {
  EN_PROGRESO = 'EN_PROGRESO',
  COMPLETADA = 'COMPLETADA',
  CANCELADA = 'CANCELADA',
}

export class ItemChecklistDto {
  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsBoolean()
  aprobado: boolean;

  @IsOptional()
  @IsString()
  observacion?: string;
}

export class CrearInspeccionDto {
  @IsUUID()
  @IsNotEmpty()
  supervisorId: string;

  @IsUUID()
  @IsNotEmpty()
  sucursalId: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  ubicacion: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  tipoTrabajo: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemChecklistDto)
  checklist?: ItemChecklistDto[];

  @IsOptional()
  @IsString()
  observaciones?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  trabajadorIds?: string[];
}

export class CerrarInspeccionDto {
  @IsOptional()
  @IsNumber()
  latitudCierre?: number;

  @IsOptional()
  @IsNumber()
  longitudCierre?: number;
}

export class ActualizarChecklistDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemChecklistDto)
  checklist: ItemChecklistDto[];

  @IsOptional()
  @IsString()
  observaciones?: string;
}

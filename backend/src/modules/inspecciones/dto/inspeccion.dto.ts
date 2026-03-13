import {
  IsString, IsNotEmpty, IsOptional, IsUUID,
  IsBoolean, IsNumber, IsArray, ValidateNested, IsEnum,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { TipoInspeccion } from '@prisma/client';

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

  // Sinergia con Equipos — PRE_USO requiere equipoId
  @IsOptional()
  @IsEnum(TipoInspeccion)
  tipoInspeccion?: TipoInspeccion;

  @IsOptional()
  @IsUUID()
  equipoId?: string;

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

  @IsOptional()
  @IsString()
  firmaBase64?: string;
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

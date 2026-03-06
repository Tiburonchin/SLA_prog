import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsUUID, IsNumberString,
} from 'class-validator';

export enum SeveridadFalta {
  LEVE = 'LEVE',
  GRAVE = 'GRAVE',
  CRITICA = 'CRITICA',
}

export class CrearAmonestacionDto {
  @IsUUID()
  @IsNotEmpty()
  trabajadorId: string;

  @IsUUID()
  @IsNotEmpty()
  supervisorId: string;

  @IsUUID()
  @IsNotEmpty()
  sucursalId: string;

  @IsString()
  @IsNotEmpty()
  motivo: string;

  @IsEnum(SeveridadFalta)
  severidad: SeveridadFalta;

  @IsString()
  @IsNotEmpty()
  descripcion: string;

  @IsOptional()
  @IsString()
  testimonios?: string;

  @IsDateString()
  fechaEvento: string;
}

/**
 * DTO para filtrar y paginar amonestaciones.
 * [FUN-01c] Se agregaron los campos `page` y `limit` para habilitar
 * la paginación desde el query string sin que el ValidationPipe
 * (forbidNonWhitelisted) los rechace.
 */
export class FiltrarAmonestacionesDto {
  @IsOptional()
  @IsUUID()
  trabajadorId?: string;

  @IsOptional()
  @IsUUID()
  supervisorId?: string;

  @IsOptional()
  @IsUUID()
  sucursalId?: string;

  @IsOptional()
  @IsEnum(SeveridadFalta)
  severidad?: SeveridadFalta;

  /** Número de página (query string). Ej: ?page=1 */
  @IsOptional()
  @IsNumberString()
  page?: string;

  /** Límite de resultados por página. Ej: ?limit=20 */
  @IsOptional()
  @IsNumberString()
  limit?: string;
}

import {
  IsString, IsNotEmpty, IsEnum, IsOptional, IsDateString, IsUUID,
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
}

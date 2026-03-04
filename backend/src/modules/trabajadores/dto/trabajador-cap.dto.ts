import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CrearCapacitacionDto {
  @IsString()
  nombreCurso: string;

  @IsOptional() @IsString()
  institucion?: string;

  @IsDateString()
  fechaRealizacion: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsString()
  certificadoUrl?: string;
}

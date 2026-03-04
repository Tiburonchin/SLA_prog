import { IsString, IsOptional, IsDateString } from 'class-validator';

export class CrearEntregaEppDto {
  @IsString()
  tipoEpp: string;

  @IsOptional() @IsString()
  marca?: string;

  @IsOptional() @IsString()
  talla?: string;

  @IsDateString()
  fechaEntrega: string;

  @IsOptional() @IsDateString()
  fechaVencimiento?: string;

  @IsOptional() @IsString()
  observaciones?: string;
}

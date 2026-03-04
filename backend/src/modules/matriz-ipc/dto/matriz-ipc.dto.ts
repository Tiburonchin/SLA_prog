import { IsString, IsNotEmpty, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { Transform } from 'class-transformer';

export class CrearMatrizIpcDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  cargo: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  ubicacion: string;

  @IsArray()
  @IsString({ each: true })
  eppsObligatorios: string[];

  @IsArray()
  @IsString({ each: true })
  herramientasRequeridas: string[];

  @IsArray()
  @IsString({ each: true })
  capacitacionesRequeridas: string[];

  @IsOptional()
  @IsString()
  descripcion?: string;
}

export class ActualizarMatrizIpcDto {
  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsString()
  ubicacion?: string;

  @IsOptional() @IsArray() @IsString({ each: true })
  eppsObligatorios?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  herramientasRequeridas?: string[];

  @IsOptional() @IsArray() @IsString({ each: true })
  capacitacionesRequeridas?: string[];

  @IsOptional() @IsString()
  descripcion?: string;

  @IsOptional() @IsBoolean()
  activo?: boolean;
}

import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoSalud } from '@prisma/client';

export class CrearTrabajadorDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  dni: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  nombreCompleto: string;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.trim())
  cargo: string;

  @IsUUID()
  sucursalId: string;

  @IsOptional() @IsString()
  tipoSangre?: string;

  @IsOptional() @IsString()
  telefonoEmergencia?: string;

  @IsOptional() @IsString()
  contactoEmergencia?: string;

  @IsOptional() @IsEnum(EstadoSalud)
  estadoSalud?: EstadoSalud;

  @IsOptional() @IsString()
  tallaCasco?: string;

  @IsOptional() @IsString()
  tallaCamisa?: string;

  @IsOptional() @IsString()
  tallaPantalon?: string;

  @IsOptional() @IsString()
  tallaCalzado?: string;

  @IsOptional() @IsString()
  tallaGuantes?: string;
}

export class ActualizarTrabajadorDto {
  @IsOptional() @IsString()
  nombreCompleto?: string;

  @IsOptional() @IsString()
  cargo?: string;

  @IsOptional() @IsUUID()
  sucursalId?: string;

  @IsOptional() @IsString()
  tipoSangre?: string;

  @IsOptional() @IsString()
  telefonoEmergencia?: string;

  @IsOptional() @IsString()
  contactoEmergencia?: string;

  @IsOptional() @IsEnum(EstadoSalud)
  estadoSalud?: EstadoSalud;

  @IsOptional() @IsString()
  tallaCasco?: string;

  @IsOptional() @IsString()
  tallaCamisa?: string;

  @IsOptional() @IsString()
  tallaPantalon?: string;

  @IsOptional() @IsString()
  tallaCalzado?: string;

  @IsOptional() @IsString()
  tallaGuantes?: string;
}

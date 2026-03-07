import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { EstadoEMO, EstadoLaboral } from '@prisma/client';

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

  @IsOptional() @IsEnum(EstadoEMO)
  estadoEMO?: EstadoEMO;

  @IsOptional() @IsEnum(EstadoLaboral)
  estadoLaboral?: EstadoLaboral;

  @IsOptional() @IsString()
  fechaVencimientoEMO?: string;

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

  @IsOptional() @IsString()
  fotoBase64?: string;

  @IsOptional() @IsString()
  alergiasCriticas?: string;

  @IsOptional() @IsString()
  condicionesPreexistentes?: string;

  @IsOptional() @IsString()
  eps?: string;

  @IsOptional() @IsString()
  arl?: string;

  @IsOptional() @IsString()
  fechaUltimoExamen?: string;

  @IsOptional() @IsString()
  fechaIngreso?: string;

  @IsOptional() @IsString()
  fechaNacimiento?: string;

  @IsOptional() @IsString()
  curp?: string;

  @IsOptional() @IsString()
  nss?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  correo?: string;

  @IsOptional() @IsString()
  turno?: string;

  @IsOptional() @IsString()
  nivelEducativo?: string;
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

  @IsOptional() @IsEnum(EstadoEMO)
  estadoEMO?: EstadoEMO;

  @IsOptional() @IsEnum(EstadoLaboral)
  estadoLaboral?: EstadoLaboral;

  @IsOptional() @IsString()
  fechaVencimientoEMO?: string;

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

  @IsOptional() @IsString()
  fotoBase64?: string;

  @IsOptional() @IsString()
  alergiasCriticas?: string;

  @IsOptional() @IsString()
  condicionesPreexistentes?: string;

  @IsOptional() @IsString()
  eps?: string;

  @IsOptional() @IsString()
  arl?: string;

  @IsOptional() @IsString()
  fechaUltimoExamen?: string;

  @IsOptional() @IsString()
  fechaIngreso?: string;

  @IsOptional() @IsString()
  fechaNacimiento?: string;

  @IsOptional() @IsString()
  curp?: string;

  @IsOptional() @IsString()
  nss?: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsString()
  correo?: string;

  @IsOptional() @IsString()
  turno?: string;

  @IsOptional() @IsString()
  nivelEducativo?: string;
}

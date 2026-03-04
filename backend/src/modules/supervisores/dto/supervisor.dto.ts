import { IsString, IsOptional, IsArray, IsUUID } from 'class-validator';

export class CrearSupervisorDto {
  @IsUUID()
  usuarioId: string;

  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  sucursalIds?: string[];
}

export class ActualizarSupervisorDto {
  @IsOptional() @IsString()
  telefono?: string;

  @IsOptional() @IsArray() @IsUUID('4', { each: true })
  sucursalIds?: string[];
}

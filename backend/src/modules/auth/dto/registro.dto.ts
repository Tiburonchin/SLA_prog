import { IsEmail, IsEnum, IsNotEmpty, IsString, MinLength, Matches } from 'class-validator';
import { Rol } from '@prisma/client';

export class RegistroDto {
  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'La contraseña debe incluir al menos una mayúscula, una minúscula y un número',
  })
  contrasena: string;

  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es obligatorio' })
  nombreCompleto: string;

  @IsEnum(Rol, { message: 'El rol debe ser COORDINADOR, SUPERVISOR o JEFATURA' })
  rol: Rol;
}

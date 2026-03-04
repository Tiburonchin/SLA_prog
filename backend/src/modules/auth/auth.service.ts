import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  /**
   * Registrar un nuevo usuario en el sistema
   */
  async registrar(dto: RegistroDto) {
    // Verificar que el correo no exista
    const existente = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });

    if (existente) {
      throw new ConflictException('Ya existe un usuario con ese correo');
    }

    // Encriptar contraseña con bcrypt (10 salt rounds)
    const contrasenaHash = await bcrypt.hash(dto.contrasena, 10);

    // Crear usuario
    const usuario = await this.prisma.usuario.create({
      data: {
        correo: dto.correo,
        contrasena: contrasenaHash,
        nombreCompleto: dto.nombreCompleto,
        rol: dto.rol,
      },
    });

    // Retornar token JWT
    return this.generarToken(usuario);
  }

  /**
   * Iniciar sesión con correo y contraseña
   */
  async login(dto: LoginDto) {
    // Buscar usuario por correo (insensible a mayúsculas/minúsculas y espacios)
    const correoNormalizado = dto.correo.toLowerCase().trim();
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: correoNormalizado },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('La cuenta está desactivada');
    }

    // Verificar contraseña
    const contrasenaValida = await bcrypt.compare(dto.contrasena, usuario.contrasena);

    if (!contrasenaValida) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    return this.generarToken(usuario);
  }

  /**
   * Generar token JWT con datos del usuario
   */
  private generarToken(usuario: { id: string; correo: string; rol: string; nombreCompleto: string }) {
    const payload = {
      sub: usuario.id,
      correo: usuario.correo,
      rol: usuario.rol,
    };

    return {
      token: this.jwtService.sign(payload),
      usuario: {
        id: usuario.id,
        correo: usuario.correo,
        nombreCompleto: usuario.nombreCompleto,
        rol: usuario.rol,
      },
    };
  }
}

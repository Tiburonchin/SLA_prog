import { Controller, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from './roles.guard';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegistroDto } from './dto/registro.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * POST /api/auth/registro
   * Crear una nueva cuenta de usuario
   */
  @Post('registro')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('COORDINADOR')
  async registrar(@Body() dto: RegistroDto) {
    return this.authService.registrar(dto);
  }

  /**
   * POST /api/auth/login
   * Iniciar sesión y obtener token JWT
   */
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }
}

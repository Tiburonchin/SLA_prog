import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

export const ROLES_KEY = 'roles';

/**
 * Decorador para definir los roles permitidos en un endpoint
 * Uso: @Roles('COORDINADOR', 'SUPERVISOR')
 */
import { SetMetadata } from '@nestjs/common';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const rolesRequeridos = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Si el endpoint no tiene @Roles(), permitir acceso
    if (!rolesRequeridos || rolesRequeridos.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();

    if (!user) {
      throw new ForbiddenException('No se encontró información del usuario');
    }

    const tieneRol = rolesRequeridos.includes(user.rol);

    if (!tieneRol) {
      throw new ForbiddenException(
        `Acceso denegado. Se requiere rol: ${rolesRequeridos.join(' o ')}`,
      );
    }

    return true;
  }
}

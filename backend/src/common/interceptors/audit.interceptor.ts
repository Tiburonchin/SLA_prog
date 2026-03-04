import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, ip, body, user } = request;

    // Solo auditar métodos que modifiquen datos
    const auditableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    if (!auditableMethods.includes(method)) {
      return next.handle();
    }

    return next.handle().pipe(
      tap(async (data) => {
        try {
          if (!user || !user.id) {
             // Si la ruta no está protegida y no hay usuario, omitir auditoría
             return;
          }

          // Determinar entidad y acción basados en la URL y el método
          const pathParts = url.split('/').filter(p => p.length > 0);
          const baseEntity = pathParts[1] || 'general'; // /api/entidad/...
          
          let accion = 'UNKNOWN';
          if (method === 'POST') accion = `CREAR_${baseEntity.toUpperCase()}`;
          else if (method === 'PUT' || method === 'PATCH') accion = `ACTUALIZAR_${baseEntity.toUpperCase()}`;
          else if (method === 'DELETE') accion = `ELIMINAR_${baseEntity.toUpperCase()}`;

          // Sanitize body (quitar contraseñas si las hay)
          const sanitizedBody = { ...body };
          if (sanitizedBody.contrasena) delete sanitizedBody.contrasena;

          // Extraer ID de la entidad si viene en la respuesta o en la url
          let entidadId = null;
          if (data && data.id) {
            entidadId = data.id.toString();
          } else if (pathParts.length > 2) {
            entidadId = pathParts[pathParts.length - 1]; // asumimos el último segmento como ID si no hay en data
          }

          // Guardar asíncronamente
          await this.prisma.registroAuditoria.create({
            data: {
              usuarioId: user.id,
              accion,
              entidad: baseEntity.toUpperCase(),
              entidadId,
              detalles: sanitizedBody,
              ip,
            },
          });
          
          this.logger.debug(`[Audit] ${accion} por usuario ${user.id}`);
        } catch (error) {
          this.logger.error(`Error guardando AuditLog: ${error.message}`);
        }
      }),
    );
  }
}

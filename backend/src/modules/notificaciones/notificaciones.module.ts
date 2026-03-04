import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesCron } from './notificaciones.cron';
import { NotificacionesGateway } from './notificaciones.gateway';

@Module({
  imports: [ConfigModule, PrismaModule],
  providers: [NotificacionesService, NotificacionesCron, NotificacionesGateway],
  exports: [NotificacionesService, NotificacionesGateway],
})
export class NotificacionesModule {}

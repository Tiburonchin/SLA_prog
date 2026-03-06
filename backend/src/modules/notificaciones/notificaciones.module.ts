import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificacionesService } from './notificaciones.service';
import { NotificacionesCron } from './notificaciones.cron';
import { NotificacionesGateway } from './notificaciones.gateway';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: {
          expiresIn: config.get<string>('JWT_EXPIRATION', '24h') as any,
        },
      }),
    }),
  ],
  providers: [NotificacionesService, NotificacionesCron, NotificacionesGateway],
  exports: [NotificacionesService, NotificacionesGateway],
})
export class NotificacionesModule {}

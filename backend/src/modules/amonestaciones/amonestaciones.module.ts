import { Module } from '@nestjs/common';
import { AmonestacionesController } from './amonestaciones.controller';
import { AmonestacionesService } from './amonestaciones.service';
import { NotificacionesModule } from '../notificaciones/notificaciones.module';

@Module({
  imports: [NotificacionesModule],
  controllers: [AmonestacionesController],
  providers: [AmonestacionesService],
  exports: [AmonestacionesService],
})
export class AmonestacionesModule {}

import { Module } from '@nestjs/common';
import { InspeccionesController } from './inspecciones.controller';
import { InspeccionesService } from './inspecciones.service';

@Module({
  controllers: [InspeccionesController],
  providers: [InspeccionesService],
  exports: [InspeccionesService],
})
export class InspeccionesModule {}

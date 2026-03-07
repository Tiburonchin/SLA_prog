import { Module } from '@nestjs/common';
import { SucursalesService } from './sucursales.service';
import { SucursalesController } from './sucursales.controller';
import { SucursalesAlertasService } from './sucursales-alertas.service';

@Module({
  controllers: [SucursalesController],
  providers: [SucursalesService, SucursalesAlertasService],
  exports: [SucursalesService],
})
export class SucursalesModule {}

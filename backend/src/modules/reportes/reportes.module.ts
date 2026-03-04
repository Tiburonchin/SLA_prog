import { Module } from '@nestjs/common';
import { ReportesController } from './reportes.controller';
import { ReportesService } from './reportes.service';
import { PdfService } from './pdf.service';

@Module({
  controllers: [ReportesController],
  providers: [ReportesService, PdfService],
  exports: [ReportesService, PdfService],
})
export class ReportesModule {}

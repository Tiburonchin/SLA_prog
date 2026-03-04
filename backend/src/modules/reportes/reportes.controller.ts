import { Controller, Get, Param, Res, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard, Roles } from '../auth/roles.guard';
import { ReportesService } from './reportes.service';
import { PdfService } from './pdf.service';

@Controller('reportes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ReportesController {
  constructor(
    private readonly reportesService: ReportesService,
    private readonly pdfService: PdfService
  ) {}

  @Get('pdf/semanal')
  @Roles('COORDINADOR', 'JEFATURA')
  async generarReporteSemanalPdf(@Res() res: Response) {
    try {
      const buffer = await this.reportesService.generarReporteSemanal();
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename=reporte_semanal.pdf',
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Error generando PDF:', error);
      throw new HttpException('Error al generar el reporte PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('inspeccion/:id/pdf')
  @Roles('COORDINADOR', 'JEFATURA', 'SUPERVISOR')
  async descargarActaInspeccionPdf(@Param('id') inspeccionId: string, @Res() res: Response) {
    try {
      const buffer = await this.pdfService.generarActaInspeccion(inspeccionId);
      
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=acta_inspeccion_${inspeccionId}.pdf`,
        'Content-Length': buffer.length,
      });

      res.end(buffer);
    } catch (error) {
      console.error('Error generando acta en PDF:', error);
      throw new HttpException('Error al generar el acta PDF', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

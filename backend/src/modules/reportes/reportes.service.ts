import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private prisma: PrismaService) {}

  async generarReporteSemanal(): Promise<Buffer> {
    return new Promise(async (resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Configurar Título y Cabecera
        doc.fontSize(20).text('Reporte Semanal de HSE', { align: 'center' });
        doc.moveDown();
        doc.fontSize(12).text(`Fecha de emisión: ${new Date().toLocaleDateString('es-MX')}`, { align: 'right' });
        doc.moveDown(2);

        // --- SECCIÓN 1: Estadísticas de Inspecciones ---
        const inicioSemana = new Date();
        inicioSemana.setDate(inicioSemana.getDate() - 7);

        const [inspTotal, inspCompletadas, amonTotal, amonGravesCriticas] = await Promise.all([
          this.prisma.inspeccion.count({ where: { creadoEn: { gte: inicioSemana } } }),
          this.prisma.inspeccion.count({ where: { creadoEn: { gte: inicioSemana }, estado: 'COMPLETADA' } }),
          this.prisma.amonestacion.count({ where: { fechaEvento: { gte: inicioSemana } } }),
          this.prisma.amonestacion.count({ where: { fechaEvento: { gte: inicioSemana }, severidad: { in: ['GRAVE', 'CRITICA'] } } })
        ]);

        doc.fontSize(16).text('Resumen de la Semana (Últimos 7 días)', { underline: true });
        doc.moveDown();
        
        doc.fontSize(12).text(`• Inspecciones Registradas: ${inspTotal}`);
        doc.text(`• Inspecciones Completadas: ${inspCompletadas}`);
        doc.text(`• Amonestaciones Registradas: ${amonTotal}`);
        doc.text(`• Amonestaciones Graves/Críticas: ${amonGravesCriticas}`);
        doc.moveDown(2);

        // --- SECCIÓN 2: Calibraciones Próximas a Vencer ---
        const en30Dias = new Date();
        en30Dias.setDate(en30Dias.getDate() + 30);

        const calibracionesXVencer = await this.prisma.calibracion.findMany({
          where: {
            proximaCalibracion: { gte: new Date(), lte: en30Dias },
          },
          include: { equipo: true },
          orderBy: { proximaCalibracion: 'asc' },
        });

        doc.fontSize(16).text('Equipos Próximos a Vencer (30 Días)', { underline: true });
        doc.moveDown();

        if (calibracionesXVencer.length === 0) {
          doc.fontSize(12).font('Helvetica-Oblique').text('No hay calibraciones que venzan en los próximos 30 días.').font('Helvetica');
        } else {
          calibracionesXVencer.forEach(cal => {
            doc.fontSize(12).text(`- ${cal.equipo.nombre} (No. Serie: ${cal.equipo.numeroSerie})`);
            doc.fontSize(10).fillColor('red').text(`  Vencimiento: ${new Date(cal.proximaCalibracion).toLocaleDateString('es-MX')}`).fillColor('black');
            doc.moveDown(0.5);
          });
        }
        
        doc.moveDown(2);

        // --- Footer ---
        doc.fontSize(10).fillColor('gray').text('Sistema Integrado HSE. Generado automáticamente.', 50, doc.page.height - 50, { align: 'center' });

        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}

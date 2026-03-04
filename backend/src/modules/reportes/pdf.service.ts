import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  constructor(private readonly prisma: PrismaService) {}

  async generarActaInspeccion(inspeccionId: string): Promise<Buffer> {
    try {
      // 1. Obtener datos de la inspección
      const inspeccion = await this.prisma.inspeccion.findUnique({
        where: { id: inspeccionId },
        include: {
          supervisor: { include: { usuario: true } },
          sucursal: true,
          trabajadores: { include: { trabajador: true } },
        },
      });

      if (!inspeccion) {
        throw new Error('Inspección no encontrada');
      }

      // 2. Leer la plantilla Handlebars
      const templatePath = path.join(process.cwd(), 'src', 'modules', 'reportes', 'templates', 'acta-inspeccion.hbs');
      const templateHtml = fs.readFileSync(templatePath, 'utf8');

      // 3. Compilar la plantilla
      const template = handlebars.compile(templateHtml);

      // Convertir JSONB checklist a array
      const checklistArray = Array.isArray(inspeccion.checklist) 
        ? inspeccion.checklist 
        : (typeof inspeccion.checklist === 'string' ? JSON.parse(inspeccion.checklist as string) : Object.keys(inspeccion.checklist as any).map(k => ({ item: k, status: (inspeccion.checklist as any)[k] })));

      // 4. Interpolación de datos
      const data = {
        id: inspeccion.id,
        fechaCierre: inspeccion.fechaCierre ? inspeccion.fechaCierre.toLocaleDateString('es-MX') : 'No cerrada',
        sucursal: inspeccion.sucursal.nombre,
        ubicacion: inspeccion.ubicacion,
        tipoTrabajo: inspeccion.tipoTrabajo,
        supervisor: inspeccion.supervisor.usuario.nombreCompleto,
        estado: inspeccion.estado,
        observaciones: inspeccion.observaciones || 'Sin observaciones',
        checklist: checklistArray,
        trabajadores: inspeccion.trabajadores.map(t => t.trabajador.nombreCompleto).join(', '),
      };

      const html = template(data);

      // 5. Generar PDF con Puppeteer
      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      const page = await browser.newPage();
      
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '20px', right: '20px', bottom: '20px', left: '20px' },
      });

      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      console.error('Error generando PDF de inspección:', error);
      throw new InternalServerErrorException('Error al generar el acta de inspección en PDF');
    }
  }
}

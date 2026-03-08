import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as puppeteer from 'puppeteer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

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

  // ────────────────────────────────────────────────────────────────────────
  // Brecha 2 + 6: Generación de Dossier Técnico con sello JWT de integridad
  // ────────────────────────────────────────────────────────────────────────
  async generarDossierEquipo(
    equipoId: string,
    usuarioJwt: { id: string; nombre: string },
    ipCliente?: string,
  ): Promise<Buffer> {
    try {
      // 1. Obtener datos completos del equipo
      const equipo = await this.prisma.equipo.findUnique({
        where: { id: equipoId },
        include: {
          sucursal: { select: { id: true, nombre: true } },
          calibraciones: { orderBy: { fechaCalibracion: 'desc' } },
          mantenimientos: { orderBy: { fechaMantenimiento: 'desc' } },
          autorizaciones: {
            include: { trabajador: { select: { id: true, nombreCompleto: true, dni: true } } },
          },
        },
      });

      if (!equipo) throw new NotFoundException('Equipo no encontrado');

      // 2. Calcular MTBF
      const mantCorrectivos = equipo.mantenimientos.filter((m: any) => m.tipoMantenimiento === 'CORRECTIVO');
      let mtbfHoras: number | null = null;
      if (mantCorrectivos.length >= 2) {
        const ms =
          mantCorrectivos[mantCorrectivos.length - 1].fechaMantenimiento.getTime() -
          mantCorrectivos[0].fechaMantenimiento.getTime();
        mtbfHoras = Math.round((ms / (1000 * 60 * 60) / (mantCorrectivos.length - 1)) * 100) / 100;
      }

      // 3. Evaluar conformidad
      const hoy = new Date();
      const ultimaCalibracion = equipo.calibraciones[0];
      const calibracionVencida = !ultimaCalibracion || ultimaCalibracion.proximaCalibracion < hoy;
      const estadosNoConformes = ['BLOQUEADO_CERTIFICADO', 'BLOQUEADO_INSPECCION', 'BAJA_TECNICA', 'EN_MANTENIMIENTO'];
      const esNoConforme = estadosNoConformes.includes(equipo.estado as string) || calibracionVencida;
      const tieneObservaciones = equipo.mantenimientos.some((m: any) => !m.equipoQuedoOperativo);
      const estadoConformidad = esNoConforme ? 'NO_CONFORME' : tieneObservaciones ? 'ADVERTENCIA' : 'OPERATIVO';
      const motivoNoConformidad = calibracionVencida ? 'CALIBRACIÓN VENCIDA' : `ESTADO: ${equipo.estado}`;

      // 4. Generar sello JWT de integridad
      const fechaGeneracion = new Date();
      const payload = {
        equipoId: equipo.id,
        numeroSerie: equipo.numeroSerie,
        estadoConformidad,
        generadoPor: usuarioJwt.id,
        fechaGeneracion: fechaGeneracion.toISOString(),
      };
      const secret = process.env.JWT_SECRET ?? 'hse-secret';
      const jwtSeal = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(payload))
        .digest('hex');

      // 5. Generar ID de log y persistir en DB
      const dossierLog = await this.prisma.dossierExportLog.create({
        data: {
          equipoId: equipo.id,
          usuarioId: usuarioJwt.id,
          estadoEquipoAlExportar: equipo.estado as string,
          calibracionVigente: !calibracionVencida,
          fueNoConforme: esNoConforme,
          jwtSnapshot: jwtSeal,
          ipCliente: ipCliente ?? 'unknown',
        },
      });

      // 6. Formatear fechas para la plantilla
      const fmt = (d: Date | null) =>
        d ? d.toLocaleDateString('es-PE', { timeZone: 'América/Lima', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';

      const mantenimientosFormateados = equipo.mantenimientos.map((m: any) => ({
        ...m,
        fechaMantenimientoFmt: fmt(m.fechaMantenimiento),
      }));

      const calibracionesFormateadas = equipo.calibraciones.map((c: any) => ({
        ...c,
        fechaCalibracionFmt: fmt(c.fechaCalibracion),
        proximaCalibracionFmt: fmt(c.proximaCalibracion),
      }));

      const autorizacionesFormateadas = equipo.autorizaciones.map((a: any) => ({
        ...a,
        creadoEnFmt: fmt(a.creadoEn),
      }));

      // 7. Registrar helpers Handlebars
      handlebars.registerHelper('eq', (a: unknown, b: unknown) => a === b);

      // 8. Compilar plantilla
      const templatePath = path.join(
        process.cwd(), 'src', 'modules', 'reportes', 'templates', 'dossier-equipo.hbs',
      );
      const template = handlebars.compile(fs.readFileSync(templatePath, 'utf8'));

      const html = template({
        equipo: {
          ...equipo,
          fechaAdquisicion: fmt(equipo.fechaAdquisicion),
        },
        mantenimientos: mantenimientosFormateados,
        calibraciones: calibracionesFormateadas,
        autorizaciones: autorizacionesFormateadas,
        mtbf: { mtbfHoras, totalFallas: mantCorrectivos.length, horas: equipo.horasOperadasActuales ?? 0 },
        estadoConformidad,
        motivoNoConformidad,
        marcaAgua: esNoConforme,
        jwtSeal,
        dossierLogId: dossierLog.id,
        generadoPor: usuarioJwt.nombre,
        usuarioId: usuarioJwt.id,
        fechaGeneracion: fechaGeneracion.toLocaleString('es-PE', { timeZone: 'América/Lima' }),
      });

      // 9. Renderizar PDF
      const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '15px', right: '15px', bottom: '15px', left: '15px' },
      });
      await browser.close();

      return Buffer.from(pdfBuffer);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      console.error('Error generando dossier técnico:', error);
      throw new InternalServerErrorException('Error al generar el dossier técnico en PDF');
    }
  }
}

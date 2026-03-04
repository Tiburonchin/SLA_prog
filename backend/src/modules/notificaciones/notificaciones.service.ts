import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { NotificacionesGateway } from './notificaciones.gateway';

@Injectable()
export class NotificacionesService {
  private readonly logger = new Logger(NotificacionesService.name);
  private transporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    private notificacionesGateway: NotificacionesGateway,
  ) {
    this.transporter = nodemailer.createTransport({
      host: this.configService.get<string>('SMTP_HOST') || 'smtp.example.com',
      port: this.configService.get<number>('SMTP_PORT') || 587,
      secure: this.configService.get<boolean>('SMTP_SECURE') || false,
      auth: {
        user: this.configService.get<string>('SMTP_USER') || 'user@example.com',
        pass: this.configService.get<string>('SMTP_PASS') || 'password',
      },
    });
  }

  async enviarAlertaCalibracion(equiposPorVencer: any[]) {
    if (equiposPorVencer.length === 0) return;

    this.logger.log(`Enviando alerta para ${equiposPorVencer.length} equipos por calibrar...`);
    
    // Configura aqui a quien se deben notificar las alertas
    const emailDestino = this.configService.get<string>('NOTIFICACIONES_CORREO') || 'seguridad@hse.com';

    let htmlBody = `
      <h2>Alerta de Calibración de Equipos</h2>
      <p>Los siguientes equipos necesitan calibración en los próximos 30 días:</p>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse;">
        <tr>
          <th>Equipo</th>
          <th>Marca / S/N</th>
          <th>Próxima Calibración</th>
        </tr>
    `;

    equiposPorVencer.forEach(cal => {
      const fecha = new Date(cal.proximaCalibracion).toLocaleDateString('es-MX', { timeZone: 'UTC' });
      htmlBody += `
        <tr>
          <td>${cal.equipo.nombre}</td>
          <td>${cal.equipo.marca} - ${cal.equipo.numeroSerie}</td>
          <td>${fecha}</td>
        </tr>
      `;
    });

    htmlBody += `</table><p>Atte,<br>Sistema Automatizado HSE</p>`;

    try {
      if (this.configService.get<string>('SMTP_USER')) {
        await this.transporter.sendMail({
          from: `"Sistema HSE" <${this.configService.get<string>('SMTP_USER')}>`,
          to: emailDestino,
          subject: '⚠️ Alerta de Calibración HSE',
          html: htmlBody,
        });
        this.logger.log('Notificación de calibración enviada exitosamente.');
      } else {
        this.logger.warn('SMTP_USER no está configurado. El correo de prueba es:');
        this.logger.debug(htmlBody);
      }
    } catch (error) {
      this.logger.error('Error enviando notificación de calibración:', error);
    }
  }

  emitirAlertaPush(evento: string, data: any) {
    this.logger.log(`Emitiendo alerta push: ${evento}`);
    this.notificacionesGateway.emitirAlertaFutura(evento, data);
  }
}

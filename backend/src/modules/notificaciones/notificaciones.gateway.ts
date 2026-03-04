import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// Nota: Puedes agregar un namespace si deseas '/' o '/notifications'
@WebSocketGateway({ cors: { origin: '*' } })
export class NotificacionesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(NotificacionesGateway.name);

  // Mapa para guardar usuarios conectados (socketId -> userId)
  private clientesActivos = new Map<string, any>();

  constructor(private jwtService: JwtService) {}

  handleConnection(client: Socket) {
    try {
      // Extraer token de handshake auth o query
      const token = client.handshake.auth.token || client.handshake.query.token;
      if (!token) {
        this.logger.warn(`Desconectando cliente sin token: ${client.id}`);
        client.disconnect();
        return;
      }

      const decoded = this.jwtService.verify(token);
      this.clientesActivos.set(client.id, decoded.id);
      this.logger.log(`Cliente conectado: ${client.id} (Usuario ID: ${decoded.id})`);
    } catch (error) {
      this.logger.warn(`Desconectando cliente por token inválido: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Cliente desconectado: ${client.id}`);
    this.clientesActivos.delete(client.id);
  }

  // Método para emitir a todos o a un grupo específico
  emitirAlertaFutura(evento: string, data: any) {
    this.server.emit(evento, data);
  }
}

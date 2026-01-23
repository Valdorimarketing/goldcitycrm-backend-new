import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * Gmail WebSocket Gateway
 * Real-time bildirimler için kullanılır
 */
@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/gmail',
})
export class GmailGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private logger: Logger = new Logger('GmailGateway');

  afterInit(server: Server) {
    this.logger.log('Gmail WebSocket Gateway initialized');
  }

  handleConnection(client: Socket, ...args: any[]) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Yeni Gmail lead oluşturulduğunda event dinle
   */
  @OnEvent('gmail.lead.created')
  handleLeadCreated(payload: {
    customerId: number;
    messageId: string;
    from: string;
    subject: string;
  }) {
    this.logger.log(`Broadcasting new Gmail lead: ${payload.customerId}`);

    // Tüm bağlı client'lara bildir
    this.server.emit('gmailLeadCreated', {
      customerId: payload.customerId,
      messageId: payload.messageId,
      from: payload.from,
      subject: payload.subject,
      timestamp: new Date(),
    });
  }

  /**
   * Manuel olarak mesaj gönder (admin panel için)
   */
  sendMessageToClients(event: string, data: any) {
    this.server.emit(event, data);
  }
}

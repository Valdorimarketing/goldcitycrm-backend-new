import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

/**
 * WhatConverts WebSocket Gateway
 * 
 * Yeni lead geldiğinde frontend'e gerçek zamanlı bildirim gönderir
 */
@WebSocketGateway({
  cors: {
    origin: '*', // Production'da spesifik origin belirtin
    credentials: true,
  },
  namespace: '/whatconverts',
})
export class WhatConvertsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(WhatConvertsGateway.name);

  @WebSocketServer()
  server: Server;

  private connectedClients: Map<string, Socket> = new Map();

  afterInit(server: Server) {
    this.logger.log('🔌 WhatConverts WebSocket Gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
    this.connectedClients.set(client.id, client);

    // Kullanıcı ID'si varsa odaya ekle
    const userId = client.handshake.query.userId as string;
    if (userId) {
      client.join(`user:${userId}`);
      this.logger.log(`Client ${client.id} joined room user:${userId}`);
    }

    // Admin odası (tüm lead'leri görmek isteyen adminler için)
    const isAdmin = client.handshake.query.isAdmin === 'true';
    if (isAdmin) {
      client.join('admins');
      this.logger.log(`Client ${client.id} joined admins room`);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.connectedClients.delete(client.id);
  }

  /**
   * Yeni lead oluşturulduğunda event dinle ve broadcast et
   */
  @OnEvent('whatconverts.lead.created')
  handleLeadCreated(payload: {
    customerId: number;
    leadId: number;
    leadType: string;
    source: string;
    assignedUserId?: number;
  }) {
    this.logger.log(`📢 Broadcasting new lead: ${payload.leadId}`);

    // Tüm admin'lere gönder
    this.server.to('admins').emit('newLead', {
      type: 'NEW_LEAD',
      data: {
        customerId: payload.customerId,
        leadId: payload.leadId,
        leadType: payload.leadType,
        source: payload.source,
        timestamp: new Date().toISOString(),
      },
    });

    // Atanan kullanıcıya özel gönder
    if (payload.assignedUserId) {
      this.server.to(`user:${payload.assignedUserId}`).emit('newLead', {
        type: 'NEW_LEAD_ASSIGNED',
        data: {
          customerId: payload.customerId,
          leadId: payload.leadId,
          leadType: payload.leadType,
          source: payload.source,
          message: 'Size yeni bir lead atandı!',
          timestamp: new Date().toISOString(),
        },
      });
    }
  }

  /**
   * Lead güncellendiğinde
   */
  @OnEvent('whatconverts.lead.updated')
  handleLeadUpdated(payload: {
    customerId: number;
    leadId: number;
    changes: any;
  }) {
    this.server.to('admins').emit('leadUpdated', {
      type: 'LEAD_UPDATED',
      data: payload,
    });
  }

  /**
   * Hata durumunda
   */
  @OnEvent('whatconverts.lead.error')
  handleLeadError(payload: {
    leadId: number;
    error: string;
  }) {
    this.server.to('admins').emit('leadError', {
      type: 'LEAD_ERROR',
      data: payload,
    });
  }

  /**
   * Manuel olarak tüm client'lara mesaj gönder
   */
  broadcastToAll(event: string, data: any) {
    this.server.emit(event, data);
  }

  /**
   * Belirli kullanıcıya mesaj gönder
   */
  sendToUser(userId: number, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  /**
   * Bağlı client sayısını getir
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }
}
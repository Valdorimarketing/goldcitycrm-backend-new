import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: '/',
})
export class SalesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(SalesGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  /**
   * Yeni satış oluşturulduğunda tüm bağlı client'lara bildirir
   * Vue sayfası bu event'i dinleyerek listeyi güncelleyebilir
   */
  notifyNewSale(sale: any) {
    this.server.emit('sale-created', {
      type: 'SALE_CREATED',
      data: sale,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`New sale notification sent: ${sale.id}`);
  }

  /**
   * Satış güncellendiğinde bildirir
   */
  notifySaleUpdated(sale: any) {
    this.server.emit('sale-updated', {
      type: 'SALE_UPDATED',
      data: sale,
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Sale update notification sent: ${sale.id}`);
  }

  /**
   * Ödeme durumu değiştiğinde bildirir
   */
  notifyPaymentStatusChanged(salesProductId: number, status: {
    paidAmount: number;
    isPayCompleted: boolean;
  }) {
    this.server.emit('payment-status-changed', {
      type: 'PAYMENT_STATUS_CHANGED',
      data: {
        salesProductId,
        ...status,
      },
      timestamp: new Date().toISOString(),
    });
    this.logger.log(`Payment status change notification sent: ${salesProductId}`);
  }

  /**
   * Dashboard istatistiklerinin güncellenmesi gerektiğini bildirir
   */
  notifyDashboardUpdate() {
    this.server.emit('dashboard-update', {
      type: 'DASHBOARD_UPDATE',
      timestamp: new Date().toISOString(),
    });
    this.logger.log('Dashboard update notification sent');
  }
}
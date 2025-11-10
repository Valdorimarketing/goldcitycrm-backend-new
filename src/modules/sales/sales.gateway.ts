// src/modules/sales/sales.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SalesGateway {
  @WebSocketServer()
  server: Server;

  notifyNewSale(sale: any) {
    this.server.emit('sale-created', sale);
  }
}

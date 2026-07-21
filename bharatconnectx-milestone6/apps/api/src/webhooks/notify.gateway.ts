import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

/**
 * Spec section 6, step 3: "needs human → real-time notify dashboard
 * via WebSocket". The dashboard connects and joins a room named after
 * its own businessId (from its JWT) right after login; this gateway
 * emits into that room only, so one business never sees another's
 * notifications.
 */
@WebSocketGateway({ cors: { origin: '*' } })
export class NotifyGateway {
  private readonly logger = new Logger(NotifyGateway.name);

  @WebSocketServer()
  server: Server;

  @SubscribeMessage('join')
  handleJoin(@ConnectedSocket() client: Socket, @MessageBody() businessId: string) {
    client.join(businessId);
    this.logger.log(`Socket ${client.id} joined room ${businessId}`);
  }

  notifyHumanNeeded(businessId: string, payload: { customerId: string; text: string }) {
    this.server.to(businessId).emit('human_needed', payload);
  }
}

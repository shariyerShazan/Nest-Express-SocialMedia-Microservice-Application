import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';

@WebSocketGateway({ cors: { origin: true, credentials: true } })
export class NotificationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const token = client.handshake.auth?.token;
    if (!token) {
      client.disconnect();
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_for_all_services') as any;
      client.data.userId = decoded.userId;
      
      // Join isolated room
      client.join(decoded.userId);
      console.log(`🔔 User Connected for Notifications: ${decoded.userId}`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`🔕 User Disconnected: ${client.data.userId}`);
  }

  sendRealTimeAlert(userId: string, notificationData: any) {
    this.server.to(userId).emit('new_notification', notificationData);
  }
}

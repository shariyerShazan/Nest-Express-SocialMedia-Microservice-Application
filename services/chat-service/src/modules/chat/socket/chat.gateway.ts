import { Server, Socket } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import jwt from 'jsonwebtoken';
import { ChatService } from '../chat.service';
import { JwtPayload } from '../../../middlewares/authMiddleware';

const chatService = new ChatService();

export const setupSocketIO = async (httpServer: any) => {
  const io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true
    }
  });

  // Redis Adapter setup for scale
  const pubClient = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
  const subClient = pubClient.duplicate();
  await Promise.all([pubClient.connect(), subClient.connect()]);
  io.adapter(createAdapter(pubClient, subClient));

  // Authentication Middleware for WebSocket Handshakes
  io.use((socket, next) => {
    // We expect the token to be passed via the `auth` object: io({ auth: { token: "..." }})
    // (As defined in our open question response strategy for high compatibility)
    const token = socket.handshake.auth?.token;
    
    if (!token) {
      return next(new Error('Authentication Error: Missing Token'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'super_secret_for_all_services') as JwtPayload;
      socket.data.user = decoded; // Store user details natively on the Socket instance
      next();
    } catch (err) {
      next(new Error('Authentication Error: Invalid Token'));
    }
  });

  // Real-Time Events
  io.on('connection', (socket: Socket) => {
    const user: JwtPayload = socket.data.user;
    
    console.log(`📡 User connected: ${user.userId} (Socket: ${socket.id})`);

    // Users securely join a room named purely after their User ID. 
    // This makes routing from other pods to this specific user instantly capable (io.to(targetId).emit).
    socket.join(user.userId);

    socket.on('send_message', async (payload, callback) => {
      try {
        const { roomId, content, recipientId } = payload;
        
        // Save securely to MongoDB
        const message = await chatService.saveMessage(roomId, user.userId, content);

        // Broadcast to the exact recipient via Redis Pub/Sub backplane
        io.to(recipientId).emit('receive_message', {
          success: true,
          message
        });

        // Callback acknowledges to the sender it arrived at the database
        if (callback) callback({ success: true, message });
      } catch (error) {
        console.error('Message failed:', error);
        if (callback) callback({ success: false, error: 'Internal Send Error' });
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 User disconnected: ${user.userId}`);
    });
  });

  return io;
};

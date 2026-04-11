import { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service';
import { redisClient } from '../../config/redis';

const chatService = new ChatService();

export class ChatController {
  
  static async startChat(req: Request, res: Response, next: NextFunction) {
    try {
      const { recipientId, initialMessage } = req.body;
      const room = await chatService.getOrCreateRoom(req.user!.userId, recipientId);
      const message = await chatService.saveMessage(room.id, req.user!.userId, initialMessage);
      
      // Invalidate the active chats feed
      await redisClient.del(`chat:active:${req.user!.userId}`);
      await redisClient.del(`chat:active:${recipientId}`);
      
      res.status(201).json({ success: true, room, message });
    } catch (error) {
      next(error);
    }
  }

  static async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const { roomId } = req.params;
      const page = parseInt(req.query.page as string || '1');
      const limit = parseInt(req.query.limit as string || '50');
      
      const history = await chatService.getRoomHistory(roomId, page, limit);
      res.status(200).json({ success: true, data: history });
    } catch (error) {
      next(error);
    }
  }

  static async getActiveChats(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = `chat:active:${req.user!.userId}`;
      const cached = await redisClient.get(cacheKey);
      
      if (cached) {
        return res.status(200).json(JSON.parse(cached));
      }

      const chats = await chatService.getActiveChats(req.user!.userId);
      
      const resp = { success: true, data: chats };
      await redisClient.setEx(cacheKey, 60, JSON.stringify(resp)); // 60s TTL
      
      res.status(200).json(resp);
    } catch (error) {
      next(error);
    }
  }
}

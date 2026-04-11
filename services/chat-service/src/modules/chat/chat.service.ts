import { ChatRoom } from './models/chatRoom.schema';
import { Message } from './models/message.schema';

export class ChatService {
  async getOrCreateRoom(userId1: string, userId2: string) {
    let room = await ChatRoom.findOne({
      participants: { $all: [userId1, userId2] }
    });

    if (!room) {
      room = await ChatRoom.create({
        participants: [userId1, userId2]
      });
    }

    return room;
  }

  async saveMessage(roomId: string, senderId: string, content: string) {
    const message = await Message.create({ roomId, senderId, content });
    
    // Update lastMessageAt for sorting active chats
    await ChatRoom.updateOne({ _id: roomId }, { lastMessageAt: new Date() });
    
    return message;
  }

  async getRoomHistory(roomId: string, page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    return Message.find({ roomId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();
  }

  async getActiveChats(userId: string) {
    return ChatRoom.find({ participants: userId })
      .sort({ lastMessageAt: -1 })
      .lean();
  }
}

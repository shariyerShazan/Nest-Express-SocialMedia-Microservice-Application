import mongoose, { Schema, Document } from 'mongoose';

export interface IMessage extends Document {
  roomId: string;
  senderId: string;
  content: string;
  isRead: boolean;
}

const MessageSchema: Schema = new Schema({
  roomId: { type: Schema.Types.ObjectId, ref: 'ChatRoom', required: true },
  senderId: { type: String, required: true },
  content: { type: String, required: true },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

// Highly optimized compound index for offset pagination within a specific chat room
MessageSchema.index({ roomId: 1, createdAt: -1 });

export const Message = mongoose.model<IMessage>('Message', MessageSchema);

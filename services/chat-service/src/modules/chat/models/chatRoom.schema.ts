import mongoose, { Schema, Document } from 'mongoose';

export interface IChatRoom extends Document {
  participants: string[];
  lastMessageAt: Date;
}

const ChatRoomSchema: Schema = new Schema({
  participants: [{ type: String, required: true }],
  lastMessageAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Index for efficiently querying a user's active chats
ChatRoomSchema.index({ participants: 1, lastMessageAt: -1 });

export const ChatRoom = mongoose.model<IChatRoom>('ChatRoom', ChatRoomSchema);

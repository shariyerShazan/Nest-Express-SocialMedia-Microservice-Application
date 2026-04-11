import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Like extends Document {
  @Prop({ required: true })
  userId: string;

  @Prop({ type: Types.ObjectId, ref: 'Post', required: true })
  postId: string;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

// Ensures a user can only like a specific post once
LikeSchema.index({ userId: 1, postId: 1 }, { unique: true });

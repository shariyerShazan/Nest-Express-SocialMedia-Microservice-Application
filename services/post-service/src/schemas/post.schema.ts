import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Post extends Document {
  @Prop({ required: true, index: true })         // Indexed - heavily queried by authorId
  authorId: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  imageUrl?: string;

  @Prop({ default: 0, min: 0 })
  likesCount: number;

  @Prop({ default: 0, min: 0 })
  commentsCount: number;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const PostSchema = SchemaFactory.createForClass(Post);

// ─── Optimized Compound Indexes ──────────────────────────────────────────────
// Primary query pattern: sorted feed filtered by isDeleted
PostSchema.index({ isDeleted: 1, createdAt: -1 });
// Cursor-based pagination support
PostSchema.index({ _id: 1, createdAt: -1 });
// Per-user post history
PostSchema.index({ authorId: 1, isDeleted: 1, createdAt: -1 });

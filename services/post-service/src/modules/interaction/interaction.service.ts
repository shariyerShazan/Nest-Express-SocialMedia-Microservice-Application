import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Like } from '../../schemas/like.schema';
import { Comment } from '../../schemas/comment.schema';
import { Post } from '../../schemas/post.schema';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class InteractionService {
  constructor(
    @InjectModel(Like.name) private likeModel: Model<Like>,
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Post.name) private postModel: Model<Post>,
  ) {}

  async likePost(userId: string, postId: string) {
    const post = await this.postModel.findOne({ _id: postId, isDeleted: false });
    if (!post) throw new NotFoundException('Post not found');

    try {
      await this.likeModel.create({ userId, postId });
      await this.postModel.updateOne({ _id: postId }, { $inc: { likesCount: 1 } });
      return { success: true, message: 'Post liked' };
    } catch (error: any) {
      if (error.code === 11000) {
        throw new BadRequestException('You already liked this post');
      }
      throw error;
    }
  }

  async unlikePost(userId: string, postId: string) {
    const result = await this.likeModel.deleteOne({ userId, postId });
    if (result.deletedCount > 0) {
      await this.postModel.updateOne({ _id: postId }, { $inc: { likesCount: -1 } });
    }
    return { success: true, message: 'Post unliked' };
  }

  async commentPost(userId: string, postId: string, createCommentDto: CreateCommentDto) {
    const post = await this.postModel.findOne({ _id: postId, isDeleted: false });
    if (!post) throw new NotFoundException('Post not found');

    const comment = await this.commentModel.create({
      authorId: userId,
      postId,
      content: createCommentDto.content,
    });

    await this.postModel.updateOne({ _id: postId }, { $inc: { commentsCount: 1 } });
    return comment;
  }

  async getComments(postId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.commentModel
      .find({ postId, isDeleted: false })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }
}

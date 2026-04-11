import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Post } from '../../schemas/post.schema';
import { CreatePostDto, UpdatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(@InjectModel(Post.name) private postModel: Model<Post>) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    const newPost = new this.postModel({
      ...createPostDto,
      authorId: userId,
    });
    return newPost.save();
  }

  async getPostById(postId: string) {
    const post = await this.postModel.findOne({ _id: postId, isDeleted: false }).exec();
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async updatePost(userId: string, postId: string, updatePostDto: UpdatePostDto) {
    const post = await this.getPostById(postId);
    if (post.authorId !== userId) {
      throw new UnauthorizedException('You can only edit your own posts');
    }

    Object.assign(post, updatePostDto);
    return post.save();
  }

  async deletePost(userId: string, postId: string) {
    const post = await this.getPostById(postId);
    if (post.authorId !== userId) {
      // NOTE: Admin deletes are processed via RabbitMQ from AdminService
      throw new UnauthorizedException('You can only delete your own posts');
    }

    post.isDeleted = true;
    await post.save();
    return { success: true, message: 'Post deleted safely' };
  }
}

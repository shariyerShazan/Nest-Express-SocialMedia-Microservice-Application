import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { redisClient } from '../../config/db';
import { NotFoundError, apiResponse } from '../../utils/errors';

// Define Post schema for Mongoose (Express app)
const postSchema = new mongoose.Schema({
  authorId: String,
  content: String,
  imageUrl: String,
  likesCount: Number,
  commentsCount: Number,
  isDeleted: Boolean,
}, { timestamps: true });

const Post = mongoose.model('Post', postSchema);

export class AdminFeedController {
  static async listPosts(req: Request, res: Response, next: NextFunction) {
    try {
      const cacheKey = 'admin:posts:list';
      const cachedData = await redisClient.get(cacheKey);

      if (cachedData) {
        return res.status(200).json(apiResponse.success(JSON.parse(cachedData), 'Posts list (cached)'));
      }

      const posts = await Post.find().sort({ createdAt: -1 }).limit(100).lean();

      await redisClient.setEx(cacheKey, 30, JSON.stringify(posts));
      res.status(200).json(apiResponse.success(posts, 'Posts list retrieved'));
    } catch (error) {
      next(error);
    }
  }

  static async hidePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const post = await Post.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
      if (!post) throw new NotFoundError('Post not found');

      await redisClient.del('admin:posts:list');
      res.status(200).json(apiResponse.success(post, 'Post hidden successfully'));
    } catch (error) {
      next(error);
    }
  }

  static async hardDeletePost(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const post = await Post.findByIdAndDelete(id);
      if (!post) throw new NotFoundError('Post not found');

      await redisClient.del('admin:posts:list');
      res.status(200).json(apiResponse.success(null, 'Post hard-deleted successfully'));
    } catch (error) {
      next(error);
    }
  }
}

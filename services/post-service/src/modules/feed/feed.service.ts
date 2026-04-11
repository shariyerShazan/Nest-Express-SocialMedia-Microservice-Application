import { Injectable, Inject, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post } from '../../schemas/post.schema';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

export interface FeedResult {
  posts: any[];
  nextCursor: string | null;
  hasMore: boolean;
}

@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    @InjectModel(Post.name) private postModel: Model<Post>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // ─── Cursor-Based Pagination Feed ───────────────────────────────────────────
  // Significantly more scalable than offset pagination for large collections.
  // Uses `_id` as cursor (guaranteed monotonic), avoiding skip() scans.
  async getGlobalFeed(limit = 20, cursor?: string): Promise<FeedResult> {
    const cacheKey = `global_feed:cursor_${cursor || 'start'}:limit_${limit}`;

    const cached = await this.cacheManager.get<FeedResult>(cacheKey);
    if (cached) {
      this.logger.debug('Cache HIT: global feed');
      return cached;
    }

    this.logger.debug('Cache MISS: querying MongoDB for feed');

    // Build query: if cursor provided, fetch posts older than that _id
    const query: Record<string, any> = { isDeleted: false };
    if (cursor) {
      query._id = { $lt: new Types.ObjectId(cursor) };
    }

    const posts = await this.postModel
      .find(query)
      .limit(limit + 1)           // Fetch one extra to determine hasMore
      .sort({ _id: -1 })          // Uses the compound index (isDeleted, createdAt)
      .select('authorId content imageUrl likesCount commentsCount createdAt')
      .lean()
      .exec();

    const hasMore = posts.length > limit;
    const sliced = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? String(sliced[sliced.length - 1]._id) : null;

    const result: FeedResult = { posts: sliced, nextCursor, hasMore };

    // Cache for 2 minutes
    await this.cacheManager.set(cacheKey, result, 120000);

    return result;
  }

  // ─── Cache Invalidation on New Post ─────────────────────────────────────────
  async invalidateFeedCache(): Promise<void> {
    // Invalidate 1st page (both offset and cursor variants)
    await Promise.all([
      this.cacheManager.del('global_feed:cursor_start:limit_20'),
      this.cacheManager.del('global_feed:page_1:limit_20'),
    ]);
    this.logger.log('Feed cache invalidated');
  }
}

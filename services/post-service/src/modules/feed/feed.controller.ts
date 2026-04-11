import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { FeedService } from './feed.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';

@ApiTags('feed')
@ApiBearerAuth()
@Controller('feed')
@UseGuards(JwtAuthGuard)
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get()
  @ApiOperation({ summary: 'Get global feed with cursor-based pagination' })
  @ApiQuery({ name: 'cursor', required: false, description: 'ObjectId string from previous nextCursor field' })
  @ApiQuery({ name: 'limit', required: false, description: 'Results per page (max 50, default 20)' })
  @ApiResponse({ status: 200, description: 'Feed retrieved successfully' })
  async getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = Math.min(parseInt(limit || '20', 10), 50);
    const result = await this.feedService.getGlobalFeed(parsedLimit, cursor);
    return {
      success: true,
      message: 'Feed retrieved',
      data: result.posts,
      meta: {
        nextCursor: result.nextCursor,
        hasMore: result.hasMore,
        limit: parsedLimit,
      },
      error: null,
    };
  }
}

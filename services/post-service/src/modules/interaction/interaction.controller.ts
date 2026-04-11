import { Controller, Post, Delete, Body, Param, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { InteractionService } from './interaction.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/user.decorator';
import { CreateCommentDto } from './dto/create-comment.dto';

@ApiTags('interactions')
@ApiBearerAuth()
@Controller('posts')
@UseGuards(JwtAuthGuard)
export class InteractionController {
  constructor(private readonly interactionService: InteractionService) {}

  @Post(':id/like')
  @ApiOperation({ summary: 'Like a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 201, description: 'Post liked successfully' })
  @ApiResponse({ status: 400, description: 'Already liked this post' })
  likePost(@CurrentUser() user: any, @Param('id') postId: string) {
    return this.interactionService.likePost(user.userId, postId);
  }

  @Delete(':id/like')
  @ApiOperation({ summary: 'Unlike a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 200, description: 'Post unliked successfully' })
  unlikePost(@CurrentUser() user: any, @Param('id') postId: string) {
    return this.interactionService.unlikePost(user.userId, postId);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Comment on a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiResponse({ status: 201, description: 'Comment created successfully' })
  commentPost(
    @CurrentUser() user: any,
    @Param('id') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.interactionService.commentPost(user.userId, postId, dto);
  }

  @Get(':id/comments')
  @ApiOperation({ summary: 'Get comments for a post' })
  @ApiParam({ name: 'id', description: 'Post ID' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Comments retrieved successfully' })
  getComments(
    @Param('id') postId: string,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.interactionService.getComments(postId, parseInt(page) || 1, parseInt(limit) || 20);
  }
}

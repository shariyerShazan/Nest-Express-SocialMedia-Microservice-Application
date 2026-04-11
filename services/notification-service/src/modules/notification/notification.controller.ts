import { Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { NotificationService } from './notification.service';
import { JwtAuthGuard } from '../../guards/jwt-auth.guard';
import { CurrentUser } from '../../decorators/user.decorator';
import { EventPattern, Payload } from '@nestjs/microservices';
import { NotificationType } from '@prisma/client';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  // --- RabbitMQ Event Consumption Sink ---
  @EventPattern('post.liked')
  async handlePostLiked(@Payload() data: { actorId: string, authorId: string, postId: string }) {
    await this.notificationService.createNotification({
      recipientId: data.authorId,
      actorId: data.actorId,
      type: NotificationType.LIKE,
      entityId: data.postId,
      message: 'Someone liked your post'
    });
  }

  @EventPattern('comment.created')
  async handleCommentCreated(@Payload() data: { actorId: string, authorId: string, postId: string }) {
    await this.notificationService.createNotification({
      recipientId: data.authorId,
      actorId: data.actorId,
      type: NotificationType.COMMENT,
      entityId: data.postId,
      message: 'Someone commented on your post'
    });
  }

  // --- Standard REST Endpoints ---
  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get recent notifications for current user' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
  getNotifications(
    @CurrentUser() user: any,
    @Query('page') page: string,
    @Query('limit') limit: string,
  ) {
    return this.notificationService.getRecentNotifications(
      user.userId,
      parseInt(page) || 1,
      parseInt(limit) || 20
    );
  }

  @Get('unread-count')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get unread notification count' })
  @ApiResponse({ status: 200, description: 'Count retrieved successfully' })
  getUnreadCount(@CurrentUser() user: any) {
    return this.notificationService.getUnreadCount(user.userId);
  }

  @Post('mark-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark all notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read' })
  markAllAsRead(@CurrentUser() user: any) {
    return this.notificationService.markAllAsRead(user.userId);
  }
}

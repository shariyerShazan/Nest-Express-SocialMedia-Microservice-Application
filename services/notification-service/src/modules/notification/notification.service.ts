import { Injectable, Inject } from '@nestjs/common';
import { PrismaService } from '../../config/prisma.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { NotificationType } from '@prisma/client';
import { NotificationGateway } from './socket/notification.gateway';

export interface CreateNotificationDto {
  recipientId: string;
  actorId?: string;
  type: NotificationType;
  entityId?: string;
  message?: string;
}

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly gateway: NotificationGateway
  ) {}

  async createNotification(payload: CreateNotificationDto) {
    if (payload.recipientId === payload.actorId) return null; // Don't notify self

    const notification = await this.prisma.notification.create({
      data: payload,
    });

    // Highly scalable Redis cache invalidation/increment
    const cacheKey = `unread_count:${payload.recipientId}`;
    const currentCount = await this.cacheManager.get<number>(cacheKey) || 0;
    await this.cacheManager.set(cacheKey, currentCount + 1, 0); // No TTL

    // Real-Time Push to recipient
    this.gateway.sendRealTimeAlert(payload.recipientId, notification);

    return notification;
  }

  async getUnreadCount(userId: string) {
    const cacheKey = `unread_count:${userId}`;
    const cached = await this.cacheManager.get<number>(cacheKey);
    
    if (cached !== undefined && cached !== null) {
      return { count: cached };
    }

    // Cache Miss: compute from DB and save
    const count = await this.prisma.notification.count({
      where: { recipientId: userId, isRead: false }
    });
    await this.cacheManager.set(cacheKey, count, 0);

    return { count };
  }

  async getRecentNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    return this.prisma.notification.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { recipientId: userId, isRead: false },
      data: { isRead: true },
    });

    // Reset Redis Counter safely
    const cacheKey = `unread_count:${userId}`;
    await this.cacheManager.set(cacheKey, 0, 0);

    return { success: true, message: 'All notifications marked as read' };
  }
}

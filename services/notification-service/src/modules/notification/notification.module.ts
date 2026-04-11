import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { NotificationGateway } from './socket/notification.gateway';
import { PrismaService } from '../../config/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';

@Module({
  imports: [
    CacheModule.registerAsync({
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    JwtModule.register({}),
  ],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway, PrismaService],
})
export class NotificationModule {}

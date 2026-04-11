import { Module, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { PostModule } from './modules/post/post.module';
import { InteractionModule } from './modules/interaction/interaction.module';
import { FeedModule } from './modules/feed/feed.module';

@Global()
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGO_URI || 'mongodb://localhost:27017/facebook-posts'),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          url: process.env.REDIS_URL || 'redis://localhost:6379',
        }),
      }),
    }),
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'super_secret',
      signOptions: { expiresIn: '1d' },
    }),
    PostModule,
    InteractionModule,
    FeedModule,
  ],
  exports: [JwtModule, CacheModule],
})
export class AppModule {}

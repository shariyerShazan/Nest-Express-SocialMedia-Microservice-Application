import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { InteractionController } from './interaction.controller';
import { InteractionService } from './interaction.service';
import { Like, LikeSchema } from '../../schemas/like.schema';
import { Comment, CommentSchema } from '../../schemas/comment.schema';
import { Post, PostSchema } from '../../schemas/post.schema';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Like.name, schema: LikeSchema },
      { name: Comment.name, schema: CommentSchema },
      { name: Post.name, schema: PostSchema },
    ]),
    JwtModule.register({}),
  ],
  controllers: [InteractionController],
  providers: [InteractionService],
})
export class InteractionModule {}

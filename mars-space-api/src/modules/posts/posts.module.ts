import { Module } from '@nestjs/common';
import { CreatePostUseCase } from './application/use-cases/create-post.use-case';
import { DeletePostUseCase } from './application/use-cases/delete-post.use-case';
import { GetPostBySlugUseCase } from './application/use-cases/get-post-by-slug.use-case';
import { GetPostUseCase } from './application/use-cases/get-post.use-case';
import { ListPostsUseCase } from './application/use-cases/list-posts.use-case';
import { PublishPostUseCase } from './application/use-cases/publish-post.use-case';
import { UpdatePostUseCase } from './application/use-cases/update-post.use-case';
import { PostRepository } from './domain/repositories/post.repository';
import { PrismaPostRepository } from './infrastructure/persistence/prisma-post.repository';
import { ViewCounterService } from './infrastructure/view-counter.service';
import { PostsAdminController } from './presentation/posts.admin.controller';
import { PostsController } from './presentation/posts.controller';

@Module({
  controllers: [PostsController, PostsAdminController],
  providers: [
    { provide: PostRepository, useClass: PrismaPostRepository },
    ViewCounterService,
    ListPostsUseCase,
    GetPostUseCase,
    GetPostBySlugUseCase,
    CreatePostUseCase,
    UpdatePostUseCase,
    PublishPostUseCase,
    DeletePostUseCase,
  ],
  exports: [PostRepository],
})
export class PostsModule {}

import { Injectable, Logger } from '@nestjs/common';
import { Language } from '../../../../common/enums/language.enum';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { PostRepository } from '../../domain/repositories/post.repository';
import { ViewCounterService } from '../../infrastructure/view-counter.service';
import { PostResponseDto } from '../dto/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class GetPostBySlugUseCase {
  private readonly logger = new Logger(GetPostBySlugUseCase.name);

  constructor(
    private readonly postRepository: PostRepository,
    private readonly viewCounter: ViewCounterService,
  ) {}

  /**
   * Public post detail. The view counter is deliberately fire-and-forget
   * (§6.3): a failed counter write must never cost the reader their article.
   */
  async execute(slug: string, lang?: Language, ipAddress?: string): Promise<PostResponseDto> {
    const post = await this.postRepository.findBySlug(slug, true);
    if (!post) {
      throw new EntityNotFoundException('Post', slug);
    }

    if (this.viewCounter.shouldCount(post.id, ipAddress)) {
      void this.postRepository
        .incrementViewCount(post.id)
        .catch((error: unknown) =>
          this.logger.warn(
            `Failed to increment view count for post ${post.id}: ${
              error instanceof Error ? error.message : 'unknown error'
            }`,
          ),
        );
    }

    return PostMapper.toResponse(post, lang);
  }
}

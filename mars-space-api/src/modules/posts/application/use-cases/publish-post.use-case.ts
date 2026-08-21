import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { PostRepository } from '../../domain/repositories/post.repository';
import { PostResponseDto } from '../dto/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class PublishPostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string, isPublished: boolean): Promise<PostResponseDto> {
    const existing = await this.postRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Post', id);
    }

    if (isPublished && existing.content.uz.trim().length === 0) {
      throw new BusinessRuleException('A post needs Uzbek content before it can be published');
    }

    const post = await this.postRepository.update(id, {
      isPublished,
      // Stamped once, on first publication, so re-publishing keeps the
      // original date and the feed order stays stable.
      ...(isPublished
        ? existing.publishedAt === null
          ? { publishedAt: new Date() }
          : {}
        : { publishedAt: null }),
    });

    return PostMapper.toResponse(post);
  }
}

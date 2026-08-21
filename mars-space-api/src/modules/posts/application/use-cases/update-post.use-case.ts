import { Injectable } from '@nestjs/common';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import {
  sanitizeLocalizedRichText,
  stripLocalizedHtml,
} from '../../../../common/utils/sanitize-html.util';
import { slugify } from '../../../../common/utils/slugify.util';
import { PostRepository } from '../../domain/repositories/post.repository';
import { PostResponseDto, UpdatePostDto } from '../dto/post.dto';
import { normalizeTags } from '../mappers/post-tags.normalizer';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class UpdatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(id: string, dto: UpdatePostDto): Promise<PostResponseDto> {
    const existing = await this.postRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Post', id);
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      if (slug !== existing.slug && (await this.postRepository.existsBySlug(slug, id))) {
        throw new EntityAlreadyExistsException('Post', 'slug', slug);
      }
    }

    // Publishing through the general update stamps `publishedAt` once, so an
    // edit to an already-published post never resets its position in the feed.
    const publishedAt =
      dto.isPublished === true && existing.publishedAt === null
        ? new Date()
        : dto.isPublished === false
          ? null
          : undefined;

    const post = await this.postRepository.update(id, {
      slug,
      title: dto.title ? stripLocalizedHtml(normalizeLocalizedText(dto.title)) : undefined,
      excerpt: dto.excerpt ? stripLocalizedHtml(normalizeLocalizedText(dto.excerpt)) : undefined,
      content: dto.content
        ? sanitizeLocalizedRichText(normalizeLocalizedText(dto.content))
        : undefined,
      coverImageUrl: dto.coverImageUrl,
      tags: dto.tags ? normalizeTags(dto.tags) : undefined,
      readMinutes: dto.readMinutes,
      metaTitle: dto.metaTitle
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaTitle))
        : undefined,
      metaDescription: dto.metaDescription
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaDescription))
        : undefined,
      isPublished: dto.isPublished,
      publishedAt,
    });

    return PostMapper.toResponse(post);
  }
}

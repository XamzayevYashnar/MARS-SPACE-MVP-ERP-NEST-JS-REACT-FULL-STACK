import { Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import {
  sanitizeLocalizedRichText,
  stripLocalizedHtml,
} from '../../../../common/utils/sanitize-html.util';
import { generateUniqueSlug, slugify } from '../../../../common/utils/slugify.util';
import { PostRepository } from '../../domain/repositories/post.repository';
import { CreatePostDto, PostResponseDto } from '../dto/post.dto';
import { normalizeTags } from '../mappers/post-tags.normalizer';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class CreatePostUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(dto: CreatePostDto, authorId: string): Promise<PostResponseDto> {
    const title = stripLocalizedHtml(normalizeLocalizedText(dto.title));

    const slug = dto.slug
      ? await this.assertSlugFree(slugify(dto.slug))
      : await generateUniqueSlug(title.uz, (candidate) =>
          this.postRepository.existsBySlug(candidate),
        );

    const isPublished = dto.isPublished ?? false;

    const post = await this.postRepository.create({
      slug,
      title,
      excerpt: stripLocalizedHtml(normalizeLocalizedText(dto.excerpt)),
      content: sanitizeLocalizedRichText(normalizeLocalizedText(dto.content)),
      coverImageUrl: dto.coverImageUrl ?? null,
      tags: normalizeTags(dto.tags),
      authorId,
      readMinutes: dto.readMinutes ?? 3,
      metaTitle: dto.metaTitle ? stripLocalizedHtml(normalizeLocalizedText(dto.metaTitle)) : null,
      metaDescription: dto.metaDescription
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaDescription))
        : null,
      isPublished,
      // `publishedAt` is what the public list sorts by, so it is stamped the
      // moment the post goes live rather than left for a later edit to set.
      publishedAt: isPublished ? new Date() : null,
    });

    return PostMapper.toResponse(post);
  }

  private async assertSlugFree(slug: string): Promise<string> {
    if (await this.postRepository.existsBySlug(slug)) {
      throw new EntityAlreadyExistsException('Post', 'slug', slug);
    }
    return slug;
  }
}

import { Language } from '../../../../common/enums/language.enum';
import { pickLanguage, pickLanguageOptional } from '../../../../common/utils/localized-text.util';
import { Post } from '../../domain/entities/post.entity';
import { PostResponseDto } from '../dto/post.dto';

export class PostMapper {
  static toResponse(post: Post, lang?: Language): PostResponseDto {
    return {
      id: post.id,
      slug: post.slug,
      title: lang ? pickLanguage(post.title, lang) : post.title,
      excerpt: lang ? pickLanguage(post.excerpt, lang) : post.excerpt,
      content: lang ? pickLanguage(post.content, lang) : post.content,
      coverImageUrl: post.coverImageUrl,
      tags: post.tags,
      authorId: post.authorId,
      author: post.author
        ? {
            id: post.author.id,
            fullName: post.author.fullName,
            avatarUrl: post.author.avatarUrl,
          }
        : null,
      readMinutes: post.readMinutes,
      viewCount: post.viewCount,
      metaTitle: lang ? pickLanguageOptional(post.metaTitle, lang) : post.metaTitle,
      metaDescription: lang
        ? pickLanguageOptional(post.metaDescription, lang)
        : post.metaDescription,
      isPublished: post.isPublished,
      publishedAt: post.publishedAt,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  static toResponseList(posts: Post[], lang?: Language): PostResponseDto[] {
    return posts.map((post) => PostMapper.toResponse(post, lang));
  }
}

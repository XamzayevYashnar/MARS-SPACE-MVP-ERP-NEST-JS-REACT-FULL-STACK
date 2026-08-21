import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { PostRepository } from '../../domain/repositories/post.repository';
import { PostResponseDto, QueryPostsDto, QueryPublicPostsDto } from '../dto/post.dto';
import { PostMapper } from '../mappers/post.mapper';

@Injectable()
export class ListPostsUseCase {
  constructor(private readonly postRepository: PostRepository) {}

  async execute(dto: QueryPostsDto): Promise<Paginated<PostResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.postRepository.findMany({
      ...params,
      tag: dto.tag,
      isPublished: dto.isPublished,
    });

    return { items: PostMapper.toResponseList(items), meta };
  }

  /**
   * Public listing. `isPublished: true` is fixed here rather than taken from
   * the query, so no parameter combination can surface a draft.
   */
  async executePublic(dto: QueryPublicPostsDto): Promise<Paginated<PostResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: dto.sortBy ?? 'publishedAt' });

    const { items, meta } = await this.postRepository.findMany({
      ...params,
      tag: dto.tag,
      isPublished: true,
    });

    return { items: PostMapper.toResponseList(items, dto.lang), meta };
  }
}

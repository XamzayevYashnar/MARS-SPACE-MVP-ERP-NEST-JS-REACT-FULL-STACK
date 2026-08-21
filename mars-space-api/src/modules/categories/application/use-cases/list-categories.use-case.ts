import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import {
  CategoryResponseDto,
  QueryCategoriesDto,
  QueryPublicCategoriesDto,
} from '../dto/category.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class ListCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /** Admin listing — every category, localised objects intact. */
  async execute(dto: QueryCategoriesDto): Promise<Paginated<CategoryResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: dto.sortBy ?? 'sortOrder' });

    const { items, meta } = await this.categoryRepository.findMany({
      ...params,
      sortOrder: dto.sortBy ? params.sortOrder : 'asc',
      isActive: dto.isActive,
      publishedCoursesOnly: false,
    });

    return { items: CategoryMapper.toResponseList(items), meta };
  }

  /**
   * Public listing — active categories only, ordered by `sortOrder`, with a
   * count of *published* courses so the site never advertises an empty section.
   */
  async executePublic(dto: QueryPublicCategoriesDto): Promise<Paginated<CategoryResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: 'sortOrder', sortOrder: 'asc' });

    const { items, meta } = await this.categoryRepository.findMany({
      ...params,
      isActive: true,
      publishedCoursesOnly: true,
    });

    return { items: CategoryMapper.toResponseList(items, dto.lang), meta };
  }
}

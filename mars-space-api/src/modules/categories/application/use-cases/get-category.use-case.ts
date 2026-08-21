import { Injectable } from '@nestjs/common';
import { Language } from '../../../../common/enums/language.enum';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryResponseDto } from '../dto/category.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class GetCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async byId(id: string): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findById(id);
    if (!category) {
      throw new EntityNotFoundException('Category', id);
    }

    return CategoryMapper.toResponse(category);
  }

  /**
   * Public detail route. An inactive category is a 404 rather than a 403 — the
   * public API never confirms that hidden content exists (§6.4.4).
   */
  async bySlug(slug: string, lang?: Language): Promise<CategoryResponseDto> {
    const category = await this.categoryRepository.findBySlug(slug, true);
    if (!category) {
      throw new EntityNotFoundException('Category', slug);
    }

    return CategoryMapper.toResponse(category, lang);
  }
}

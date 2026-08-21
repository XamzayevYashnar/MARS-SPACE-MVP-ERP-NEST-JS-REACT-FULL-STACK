import { Injectable } from '@nestjs/common';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import { stripLocalizedHtml } from '../../../../common/utils/sanitize-html.util';
import { slugify } from '../../../../common/utils/slugify.util';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryResponseDto, UpdateCategoryDto } from '../dto/category.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class UpdateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(id: string, dto: UpdateCategoryDto): Promise<CategoryResponseDto> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Category', id);
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      if (slug !== existing.slug && (await this.categoryRepository.existsBySlug(slug, id))) {
        throw new EntityAlreadyExistsException('Category', 'slug', slug);
      }
    }

    const category = await this.categoryRepository.update(id, {
      slug,
      name: dto.name ? stripLocalizedHtml(normalizeLocalizedText(dto.name)) : undefined,
      description: dto.description
        ? stripLocalizedHtml(normalizeLocalizedText(dto.description))
        : undefined,
      iconKey: dto.iconKey,
      colorHex: dto.colorHex,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
    });

    return CategoryMapper.toResponse(category);
  }
}

import { Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import { stripLocalizedHtml } from '../../../../common/utils/sanitize-html.util';
import { generateUniqueSlug, slugify } from '../../../../common/utils/slugify.util';
import { CategoryRepository } from '../../domain/repositories/category.repository';
import { CategoryResponseDto, CreateCategoryDto } from '../dto/category.dto';
import { CategoryMapper } from '../mappers/category.mapper';

@Injectable()
export class CreateCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    const name = stripLocalizedHtml(normalizeLocalizedText(dto.name));

    // An explicit slug is taken at face value and must be free; an omitted one
    // is derived from name.uz and disambiguated with -2, -3, … (§6.4.1).
    const slug = dto.slug
      ? await this.assertSlugFree(slugify(dto.slug))
      : await generateUniqueSlug(name.uz, (candidate) =>
          this.categoryRepository.existsBySlug(candidate),
        );

    const category = await this.categoryRepository.create({
      slug,
      name,
      description: dto.description
        ? stripLocalizedHtml(normalizeLocalizedText(dto.description))
        : null,
      iconKey: dto.iconKey ?? null,
      colorHex: dto.colorHex ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
    });

    return CategoryMapper.toResponse(category);
  }

  private async assertSlugFree(slug: string): Promise<string> {
    if (await this.categoryRepository.existsBySlug(slug)) {
      throw new EntityAlreadyExistsException('Category', 'slug', slug);
    }
    return slug;
  }
}

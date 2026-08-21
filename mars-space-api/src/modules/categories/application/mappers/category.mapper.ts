import { Language } from '../../../../common/enums/language.enum';
import { pickLanguage, pickLanguageOptional } from '../../../../common/utils/localized-text.util';
import { Category } from '../../domain/entities/category.entity';
import { CategoryResponseDto } from '../dto/category.dto';

/**
 * Maps a `Category` to its response DTO.
 *
 * When `lang` is present the localised fields collapse to plain strings for
 * that locale (§6.2); admin routes pass no `lang` and keep the full object.
 */
export class CategoryMapper {
  static toResponse(category: Category, lang?: Language): CategoryResponseDto {
    return {
      id: category.id,
      slug: category.slug,
      name: lang ? pickLanguage(category.name, lang) : category.name,
      description: lang ? pickLanguageOptional(category.description, lang) : category.description,
      iconKey: category.iconKey,
      colorHex: category.colorHex,
      sortOrder: category.sortOrder,
      isActive: category.isActive,
      coursesCount: category.coursesCount,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toResponseList(categories: Category[], lang?: Language): CategoryResponseDto[] {
    return categories.map((category) => CategoryMapper.toResponse(category, lang));
  }
}

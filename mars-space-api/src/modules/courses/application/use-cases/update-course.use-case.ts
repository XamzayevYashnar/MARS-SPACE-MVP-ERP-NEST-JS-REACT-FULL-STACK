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
import { CategoryRepository } from '../../../categories/domain/repositories/category.repository';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CoursePrice } from '../../domain/value-objects/course-price.vo';
import { CourseResponseDto, UpdateCourseDto } from '../dto/course.dto';
import { normalizeStringList, normalizeSyllabus } from '../mappers/course-content.normalizer';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class UpdateCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(id: string, dto: UpdateCourseDto): Promise<CourseResponseDto> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Course', id);
    }

    if (dto.categoryId && !(await this.categoryRepository.findById(dto.categoryId))) {
      throw new EntityNotFoundException('Category', dto.categoryId);
    }

    // Either half of the price may be updated alone, so validate the resulting
    // pair rather than only the fields that happen to be present.
    if (dto.price !== undefined || dto.discountPrice !== undefined) {
      CoursePrice.create(
        dto.price ?? existing.price.amount,
        dto.discountPrice ?? existing.price.discountAmount,
        dto.currency ?? existing.price.currency,
      );
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      if (slug !== existing.slug && (await this.courseRepository.existsBySlug(slug, id))) {
        throw new EntityAlreadyExistsException('Course', 'slug', slug);
      }
    }

    const course = await this.courseRepository.update(id, {
      slug,
      title: dto.title ? stripLocalizedHtml(normalizeLocalizedText(dto.title)) : undefined,
      shortDescription: dto.shortDescription
        ? stripLocalizedHtml(normalizeLocalizedText(dto.shortDescription))
        : undefined,
      description: dto.description
        ? sanitizeLocalizedRichText(normalizeLocalizedText(dto.description))
        : undefined,
      outcomes: dto.outcomes ? normalizeStringList(dto.outcomes) : undefined,
      requirements: dto.requirements ? normalizeStringList(dto.requirements) : undefined,
      syllabus: dto.syllabus ? normalizeSyllabus(dto.syllabus) : undefined,
      categoryId: dto.categoryId,
      level: dto.level,
      format: dto.format,
      durationMonths: dto.durationMonths,
      lessonsPerWeek: dto.lessonsPerWeek,
      lessonMinutes: dto.lessonMinutes,
      price: dto.price,
      discountPrice: dto.discountPrice,
      currency: dto.currency,
      coverImageUrl: dto.coverImageUrl,
      promoVideoUrl: dto.promoVideoUrl,
      metaTitle: dto.metaTitle
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaTitle))
        : undefined,
      metaDescription: dto.metaDescription
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaDescription))
        : undefined,
      isFeatured: dto.isFeatured,
      isPublished: dto.isPublished,
      sortOrder: dto.sortOrder,
      teacherIds: dto.teacherIds,
    });

    return CourseMapper.toResponse(course);
  }
}

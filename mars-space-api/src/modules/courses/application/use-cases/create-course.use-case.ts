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
import { generateUniqueSlug, slugify } from '../../../../common/utils/slugify.util';
import { CategoryRepository } from '../../../categories/domain/repositories/category.repository';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CoursePrice } from '../../domain/value-objects/course-price.vo';
import { CourseResponseDto, CreateCourseDto } from '../dto/course.dto';
import { normalizeStringList, normalizeSyllabus } from '../mappers/course-content.normalizer';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class CreateCourseUseCase {
  constructor(
    private readonly courseRepository: CourseRepository,
    private readonly categoryRepository: CategoryRepository,
  ) {}

  async execute(dto: CreateCourseDto): Promise<CourseResponseDto> {
    if (!(await this.categoryRepository.findById(dto.categoryId))) {
      throw new EntityNotFoundException('Category', dto.categoryId);
    }

    // Constructing the value object here means an invalid discount is rejected
    // before anything reaches the database.
    CoursePrice.create(dto.price, dto.discountPrice ?? null, dto.currency ?? 'UZS');

    const title = stripLocalizedHtml(normalizeLocalizedText(dto.title));

    const slug = dto.slug
      ? await this.assertSlugFree(slugify(dto.slug))
      : await generateUniqueSlug(title.uz, (candidate) =>
          this.courseRepository.existsBySlug(candidate),
        );

    const course = await this.courseRepository.create({
      slug,
      title,
      shortDescription: stripLocalizedHtml(normalizeLocalizedText(dto.shortDescription)),
      description: sanitizeLocalizedRichText(normalizeLocalizedText(dto.description)),
      outcomes: normalizeStringList(dto.outcomes),
      requirements: normalizeStringList(dto.requirements),
      syllabus: normalizeSyllabus(dto.syllabus),
      categoryId: dto.categoryId,
      level: dto.level,
      format: dto.format,
      durationMonths: dto.durationMonths,
      lessonsPerWeek: dto.lessonsPerWeek,
      lessonMinutes: dto.lessonMinutes ?? 90,
      price: dto.price,
      discountPrice: dto.discountPrice ?? null,
      currency: dto.currency ?? 'UZS',
      coverImageUrl: dto.coverImageUrl ?? null,
      promoVideoUrl: dto.promoVideoUrl ?? null,
      metaTitle: dto.metaTitle ? stripLocalizedHtml(normalizeLocalizedText(dto.metaTitle)) : null,
      metaDescription: dto.metaDescription
        ? stripLocalizedHtml(normalizeLocalizedText(dto.metaDescription))
        : null,
      isFeatured: dto.isFeatured ?? false,
      isPublished: dto.isPublished ?? false,
      sortOrder: dto.sortOrder ?? 0,
      teacherIds: dto.teacherIds,
    });

    return CourseMapper.toResponse(course);
  }

  private async assertSlugFree(slug: string): Promise<string> {
    if (await this.courseRepository.existsBySlug(slug)) {
      throw new EntityAlreadyExistsException('Course', 'slug', slug);
    }
    return slug;
  }
}

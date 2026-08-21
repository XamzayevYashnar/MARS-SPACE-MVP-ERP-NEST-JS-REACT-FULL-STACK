import { Injectable } from '@nestjs/common';
import { FEATURED_COURSES_LIMIT } from '../../../../common/constants/app.constants';
import { Language } from '../../../../common/enums/language.enum';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CourseResponseDto, QueryCoursesDto, QueryPublicCoursesDto } from '../dto/course.dto';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class ListCoursesUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  /** Admin listing — drafts included, filters as declared in §6.3. */
  async execute(dto: QueryCoursesDto): Promise<Paginated<CourseResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.courseRepository.findMany({
      ...params,
      categoryId: dto.categoryId,
      level: dto.level,
      format: dto.format,
      isPublished: dto.isPublished,
      isFeatured: dto.isFeatured,
      teacherId: dto.teacherId,
    });

    return { items: CourseMapper.toResponseList(items), meta };
  }

  /**
   * Public listing. `isPublished: true` is set here rather than taken from the
   * query, so no combination of parameters can surface a draft (§13).
   */
  async executePublic(dto: QueryPublicCoursesDto): Promise<Paginated<CourseResponseDto>> {
    const params = buildPaginationParams({
      ...dto,
      sortBy: dto.sortBy ?? 'sortOrder',
      sortOrder: dto.sortBy ? dto.sortOrder : 'asc',
    });

    const { items, meta } = await this.courseRepository.findMany({
      ...params,
      isPublished: true,
      categorySlug: dto.categorySlug,
      level: dto.level,
      format: dto.format,
      isFeatured: dto.isFeatured,
      minPrice: dto.minPrice,
      maxPrice: dto.maxPrice,
    });

    return { items: CourseMapper.toResponseList(items, dto.lang), meta };
  }

  /** Home-page carousel: up to six featured, published courses. */
  async executeFeatured(lang?: Language): Promise<CourseResponseDto[]> {
    const courses = await this.courseRepository.findFeatured(FEATURED_COURSES_LIMIT);
    return CourseMapper.toResponseList(courses, lang);
  }
}

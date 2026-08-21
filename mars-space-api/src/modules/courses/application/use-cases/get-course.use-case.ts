import { Injectable } from '@nestjs/common';
import { Language } from '../../../../common/enums/language.enum';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CourseResponseDto } from '../dto/course.dto';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class GetCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async byId(id: string): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findById(id);
    if (!course) {
      throw new EntityNotFoundException('Course', id);
    }

    return CourseMapper.toResponse(course);
  }

  /**
   * Public detail with category, teachers, open groups and published
   * testimonials. An unpublished slug is a 404 — the public API must not
   * confirm that a draft exists (§6.4.4).
   */
  async bySlug(slug: string, lang?: Language): Promise<CourseResponseDto> {
    const course = await this.courseRepository.findBySlug(slug, true);
    if (!course) {
      throw new EntityNotFoundException('Course', slug);
    }

    return CourseMapper.toResponse(course, lang);
  }
}

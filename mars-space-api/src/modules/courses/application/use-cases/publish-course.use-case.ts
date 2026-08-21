import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CourseResponseDto } from '../dto/course.dto';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class PublishCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, isPublished: boolean): Promise<CourseResponseDto> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Course', id);
    }

    // Publishing an incomplete course would put a broken page on the public
    // site, so the minimum content is checked at the moment it goes live.
    if (isPublished) {
      if (existing.title.uz.trim().length === 0) {
        throw new BusinessRuleException('A course needs an Uzbek title before it can be published');
      }
      if (existing.shortDescription.uz.trim().length === 0) {
        throw new BusinessRuleException(
          'A course needs an Uzbek short description before it can be published',
        );
      }
    }

    // Unpublishing also clears the featured flag: a draft must never keep a
    // slot in the home-page carousel.
    const course = await this.courseRepository.update(id, {
      isPublished,
      ...(isPublished ? {} : { isFeatured: false }),
    });

    return CourseMapper.toResponse(course);
  }
}

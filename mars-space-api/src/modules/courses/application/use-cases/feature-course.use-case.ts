import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { CourseRepository } from '../../domain/repositories/course.repository';
import { CourseResponseDto } from '../dto/course.dto';
import { CourseMapper } from '../mappers/course.mapper';

@Injectable()
export class FeatureCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  async execute(id: string, isFeatured: boolean): Promise<CourseResponseDto> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Course', id);
    }

    // The featured carousel is a public surface, so only published courses may
    // enter it — otherwise the home page would link to a 404.
    if (isFeatured && !existing.isPublished) {
      throw new BusinessRuleException('Publish the course before featuring it on the home page');
    }

    const course = await this.courseRepository.update(id, { isFeatured });
    return CourseMapper.toResponse(course);
  }
}

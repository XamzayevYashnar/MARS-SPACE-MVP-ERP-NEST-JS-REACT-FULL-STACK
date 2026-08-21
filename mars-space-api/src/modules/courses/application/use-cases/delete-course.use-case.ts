import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { CourseRepository } from '../../domain/repositories/course.repository';

@Injectable()
export class DeleteCourseUseCase {
  constructor(private readonly courseRepository: CourseRepository) {}

  /** §6.4.5 — a course that still has groups is unpublished, not deleted. */
  async execute(id: string): Promise<void> {
    const existing = await this.courseRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Course', id);
    }

    const groups = await this.courseRepository.countGroups(id);
    if (groups > 0) {
      throw new BusinessRuleException(
        `This course still has ${groups} group(s) and cannot be deleted. Unpublish it instead, or remove the groups first.`,
      );
    }

    await this.courseRepository.delete(id);
  }
}

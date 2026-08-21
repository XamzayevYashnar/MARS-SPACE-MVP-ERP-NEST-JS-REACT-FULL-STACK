import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { CategoryRepository } from '../../domain/repositories/category.repository';

@Injectable()
export class DeleteCategoryUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  /**
   * §6.4.5 — a category that still holds courses cannot be hard-deleted.
   * The message names the alternative so the client can act on it.
   */
  async execute(id: string): Promise<void> {
    const existing = await this.categoryRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Category', id);
    }

    const courses = await this.categoryRepository.countCourses(id);
    if (courses > 0) {
      throw new BusinessRuleException(
        `This category still holds ${courses} course(s) and cannot be deleted. Deactivate it instead, or move the courses first.`,
      );
    }

    await this.categoryRepository.delete(id);
  }
}

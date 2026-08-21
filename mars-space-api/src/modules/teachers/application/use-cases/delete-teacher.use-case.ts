import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';

@Injectable()
export class DeleteTeacherUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  /**
   * Course links are cascade-deleted with the join rows, but a teacher who
   * still leads a group is refused: the schedule would silently lose its owner.
   */
  async execute(id: string): Promise<void> {
    const existing = await this.teacherRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Teacher', id);
    }

    const groups = await this.teacherRepository.countGroups(id);
    if (groups > 0) {
      throw new BusinessRuleException(
        `This teacher still leads ${groups} group(s) and cannot be deleted. Reassign the groups, or deactivate the teacher instead.`,
      );
    }

    await this.teacherRepository.delete(id);
  }
}

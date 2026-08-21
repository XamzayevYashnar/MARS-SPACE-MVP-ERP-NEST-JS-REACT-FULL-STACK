import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { GroupRepository } from '../../domain/repositories/group.repository';

@Injectable()
export class DeleteGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  /**
   * Deleting a group would detach its students (the FK is `SetNull`), silently
   * orphaning enrolment records — so a group with students is refused and the
   * caller is pointed at CANCELLED instead.
   */
  async execute(id: string): Promise<void> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Group', id);
    }

    const students = await this.groupRepository.countStudents(id);
    if (students > 0) {
      throw new BusinessRuleException(
        `This group still holds ${students} student(s) and cannot be deleted. Set its status to CANCELLED instead, or move the students first.`,
      );
    }

    await this.groupRepository.delete(id);
  }
}

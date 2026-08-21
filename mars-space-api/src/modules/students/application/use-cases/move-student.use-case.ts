import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { StudentResponseDto } from '../dto/student.dto';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class MoveStudentUseCase {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  /** `PATCH /admin/students/:id/move` — reassigns a student to another intake. */
  async execute(id: string, groupId: string): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new EntityNotFoundException('Student', id);
    }

    if (student.groupId === groupId) {
      throw new BusinessRuleException('The student is already in this group');
    }

    const group = await this.groupRepository.findById(groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', groupId);
    }

    // A non-active student takes no seat, so only their assignment moves.
    if (student.occupiesSeat() && !group.acceptsEnrolment()) {
      if (group.isFull()) {
        throw new GroupCapacityExceededError(group.name, group.capacity);
      }
      throw new GroupClosedForEnrolmentError(group.name, group.status);
    }

    const moved = await this.studentRepository.moveToGroupWithCapacityCheck(id, groupId);
    return StudentMapper.toResponse(moved);
  }
}

import { Injectable } from '@nestjs/common';
import { StudentStatus } from '@prisma/client';
import { EntityNotFoundException, InvalidPhoneException } from '../../../../common/exceptions';
import { normalizePhone } from '../../../../common/utils/phone.util';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { StudentResponseDto, UpdateStudentDto } from '../dto/student.dto';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class UpdateStudentUseCase {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async execute(id: string, dto: UpdateStudentDto): Promise<StudentResponseDto> {
    const existing = await this.studentRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Student', id);
    }

    let phone: string | undefined;
    if (dto.phone !== undefined) {
      const normalized = normalizePhone(dto.phone);
      if (!normalized) {
        throw new InvalidPhoneException();
      }
      phone = normalized;
    }

    // Reactivating a frozen student, or moving them here, re-occupies a seat —
    // so the capacity of the *resulting* group has to be checked.
    const targetGroupId = dto.groupId !== undefined ? dto.groupId : existing.groupId;
    const targetStatus = dto.status ?? existing.status;
    const willOccupySeat = targetStatus === StudentStatus.ACTIVE;
    const seatChanges =
      willOccupySeat &&
      targetGroupId !== null &&
      (targetGroupId !== existing.groupId || !existing.occupiesSeat());

    if (seatChanges && targetGroupId) {
      const group = await this.groupRepository.findById(targetGroupId);
      if (!group) {
        throw new EntityNotFoundException('Group', targetGroupId);
      }
      if (!group.acceptsEnrolment()) {
        if (group.isFull()) {
          throw new GroupCapacityExceededError(group.name, group.capacity);
        }
        throw new GroupClosedForEnrolmentError(group.name, group.status);
      }
    }

    const student = await this.studentRepository.update(id, {
      fullName: dto.fullName?.trim(),
      phone,
      email: dto.email,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      groupId: dto.groupId,
      status: dto.status,
      note: dto.note,
    });

    return StudentMapper.toResponse(student);
  }
}

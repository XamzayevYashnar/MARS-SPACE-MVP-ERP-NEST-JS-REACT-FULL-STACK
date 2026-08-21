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
import { CreateStudentDto, StudentResponseDto } from '../dto/student.dto';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class CreateStudentUseCase {
  constructor(
    private readonly studentRepository: StudentRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  async execute(dto: CreateStudentDto): Promise<StudentResponseDto> {
    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new InvalidPhoneException();
    }

    const status = dto.status ?? StudentStatus.ACTIVE;

    const data = {
      fullName: dto.fullName.trim(),
      phone,
      email: dto.email ?? null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      status,
      note: dto.note ?? null,
    };

    // Without a group there is no capacity to check, so the plain insert is
    // the whole operation.
    if (!dto.groupId) {
      const student = await this.studentRepository.create({ ...data, groupId: null });
      return StudentMapper.toResponse(student);
    }

    const group = await this.groupRepository.findById(dto.groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    // Checked up front so the caller gets the precise reason; the repository
    // re-checks capacity inside the transaction to close the race window.
    if (status === StudentStatus.ACTIVE) {
      if (!group.acceptsEnrolment()) {
        if (group.isFull()) {
          throw new GroupCapacityExceededError(group.name, group.capacity);
        }
        throw new GroupClosedForEnrolmentError(group.name, group.status);
      }
    }

    const student = await this.studentRepository.createWithCapacityCheck({
      ...data,
      groupId: dto.groupId,
    });

    return StudentMapper.toResponse(student);
  }
}

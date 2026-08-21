import { Injectable } from '@nestjs/common';
import {
  BusinessRuleException,
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { TeacherRepository } from '../../../teachers/domain/repositories/teacher.repository';
import { Group } from '../../domain/entities/group.entity';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { GroupResponseDto, UpdateGroupDto } from '../dto/group.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class UpdateGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly courseRepository: CourseRepository,
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async execute(id: string, dto: UpdateGroupDto): Promise<GroupResponseDto> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Group', id);
    }

    const name = dto.name?.trim();
    if (name && name !== existing.name && (await this.groupRepository.existsByName(name, id))) {
      throw new EntityAlreadyExistsException('Group', 'name', name);
    }

    if (dto.courseId && !(await this.courseRepository.existsById(dto.courseId))) {
      throw new EntityNotFoundException('Course', dto.courseId);
    }

    if (dto.teacherId && !(await this.teacherRepository.existsById(dto.teacherId))) {
      throw new EntityNotFoundException('Teacher', dto.teacherId);
    }

    const startDate = dto.startDate ? new Date(dto.startDate) : existing.startDate;
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;

    const scheduleError = Group.validateSchedule(
      dto.startTime ?? existing.startTime,
      dto.endTime ?? existing.endTime,
      startDate,
      endDate,
    );
    if (scheduleError) {
      throw new BusinessRuleException(scheduleError);
    }

    // Shrinking the capacity below the current roster would leave the group in
    // a state the enrolment rule can never produce.
    if (dto.capacity !== undefined && dto.capacity < existing.activeStudentsCount) {
      throw new BusinessRuleException(
        `Capacity cannot be lower than the ${existing.activeStudentsCount} students already enrolled`,
      );
    }

    const group = await this.groupRepository.update(id, {
      name,
      courseId: dto.courseId,
      teacherId: dto.teacherId,
      startDate: dto.startDate ? startDate : undefined,
      endDate: dto.endDate ? endDate : undefined,
      weekDays: dto.weekDays,
      startTime: dto.startTime,
      endTime: dto.endTime,
      roomName: dto.roomName,
      capacity: dto.capacity,
      status: dto.status,
    });

    return GroupMapper.toResponse(group);
  }
}

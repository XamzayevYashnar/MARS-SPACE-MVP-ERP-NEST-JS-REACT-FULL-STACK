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
import { CreateGroupDto, GroupResponseDto } from '../dto/group.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class CreateGroupUseCase {
  constructor(
    private readonly groupRepository: GroupRepository,
    private readonly courseRepository: CourseRepository,
    private readonly teacherRepository: TeacherRepository,
  ) {}

  async execute(dto: CreateGroupDto): Promise<GroupResponseDto> {
    const name = dto.name.trim();

    if (await this.groupRepository.existsByName(name)) {
      throw new EntityAlreadyExistsException('Group', 'name', name);
    }

    if (!(await this.courseRepository.existsById(dto.courseId))) {
      throw new EntityNotFoundException('Course', dto.courseId);
    }

    if (dto.teacherId && !(await this.teacherRepository.existsById(dto.teacherId))) {
      throw new EntityNotFoundException('Teacher', dto.teacherId);
    }

    const startDate = new Date(dto.startDate);
    const endDate = dto.endDate ? new Date(dto.endDate) : null;

    const scheduleError = Group.validateSchedule(dto.startTime, dto.endTime, startDate, endDate);
    if (scheduleError) {
      throw new BusinessRuleException(scheduleError);
    }

    const group = await this.groupRepository.create({
      name,
      courseId: dto.courseId,
      teacherId: dto.teacherId ?? null,
      startDate,
      endDate,
      weekDays: dto.weekDays,
      startTime: dto.startTime,
      endTime: dto.endTime,
      roomName: dto.roomName ?? null,
      capacity: dto.capacity ?? 15,
      status: dto.status,
    });

    return GroupMapper.toResponse(group);
  }
}

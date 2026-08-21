import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';
import { QueryPublicTeachersDto, QueryTeachersDto, TeacherResponseDto } from '../dto/teacher.dto';
import { TeacherMapper } from '../mappers/teacher.mapper';

@Injectable()
export class ListTeachersUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async execute(dto: QueryTeachersDto): Promise<Paginated<TeacherResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: dto.sortBy ?? 'sortOrder' });

    const { items, meta } = await this.teacherRepository.findMany({
      ...params,
      sortOrder: dto.sortBy ? params.sortOrder : 'asc',
      isActive: dto.isActive,
      courseId: dto.courseId,
    });

    return { items: TeacherMapper.toResponseList(items), meta };
  }

  async executePublic(dto: QueryPublicTeachersDto): Promise<Paginated<TeacherResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: 'sortOrder', sortOrder: 'asc' });

    const { items, meta } = await this.teacherRepository.findMany({ ...params, isActive: true });

    return { items: TeacherMapper.toResponseList(items, dto.lang), meta };
  }
}

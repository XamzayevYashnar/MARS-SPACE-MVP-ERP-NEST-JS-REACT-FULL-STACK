import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { QueryStudentsDto, StudentResponseDto } from '../dto/student.dto';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class ListStudentsUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(dto: QueryStudentsDto): Promise<Paginated<StudentResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.studentRepository.findMany({
      ...params,
      groupId: dto.groupId,
      courseId: dto.courseId,
      status: dto.status,
    });

    return { items: StudentMapper.toResponseList(items), meta };
  }
}

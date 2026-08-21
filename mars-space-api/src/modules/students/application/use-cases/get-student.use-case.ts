import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { StudentRepository } from '../../domain/repositories/student.repository';
import { StudentResponseDto } from '../dto/student.dto';
import { StudentMapper } from '../mappers/student.mapper';

@Injectable()
export class GetStudentUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  async execute(id: string): Promise<StudentResponseDto> {
    const student = await this.studentRepository.findById(id);
    if (!student) {
      throw new EntityNotFoundException('Student', id);
    }

    return StudentMapper.toResponse(student);
  }
}

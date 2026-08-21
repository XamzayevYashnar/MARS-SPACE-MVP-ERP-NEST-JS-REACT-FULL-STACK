import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { StudentRepository } from '../../domain/repositories/student.repository';

@Injectable()
export class DeleteStudentUseCase {
  constructor(private readonly studentRepository: StudentRepository) {}

  /** A student owns no dependent records, so the delete is unconditional. */
  async execute(id: string): Promise<void> {
    if (!(await this.studentRepository.findById(id))) {
      throw new EntityNotFoundException('Student', id);
    }

    await this.studentRepository.delete(id);
  }
}

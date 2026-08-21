import { Injectable } from '@nestjs/common';
import { ReorderDto } from '../../../../common/dto/reorder.dto';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';

@Injectable()
export class ReorderTeachersUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  /** Applies the whole new ordering in one transaction. */
  async execute(dto: ReorderDto): Promise<void> {
    await this.teacherRepository.reorder(dto.items);
  }
}

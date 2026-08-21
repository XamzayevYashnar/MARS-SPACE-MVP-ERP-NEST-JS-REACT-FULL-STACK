import { Injectable } from '@nestjs/common';
import { Language } from '../../../../common/enums/language.enum';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';
import { TeacherResponseDto } from '../dto/teacher.dto';
import { TeacherMapper } from '../mappers/teacher.mapper';

@Injectable()
export class GetTeacherUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async byId(id: string): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findById(id);
    if (!teacher) {
      throw new EntityNotFoundException('Teacher', id);
    }

    return TeacherMapper.toResponse(teacher);
  }

  /** Public detail: active teachers only, together with their published courses. */
  async bySlug(slug: string, lang?: Language): Promise<TeacherResponseDto> {
    const teacher = await this.teacherRepository.findBySlug(slug, true);
    if (!teacher) {
      throw new EntityNotFoundException('Teacher', slug);
    }

    return TeacherMapper.toResponse(teacher, lang);
  }
}

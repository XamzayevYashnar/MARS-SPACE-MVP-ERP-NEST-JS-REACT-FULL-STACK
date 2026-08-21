import { Injectable } from '@nestjs/common';
import {
  EntityAlreadyExistsException,
  EntityNotFoundException,
} from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import {
  sanitizeLocalizedRichText,
  stripLocalizedHtml,
} from '../../../../common/utils/sanitize-html.util';
import { slugify } from '../../../../common/utils/slugify.util';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';
import { TeacherResponseDto, UpdateTeacherDto } from '../dto/teacher.dto';
import { TeacherMapper } from '../mappers/teacher.mapper';

@Injectable()
export class UpdateTeacherUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async execute(id: string, dto: UpdateTeacherDto): Promise<TeacherResponseDto> {
    const existing = await this.teacherRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Teacher', id);
    }

    let slug: string | undefined;
    if (dto.slug) {
      slug = slugify(dto.slug);
      if (slug !== existing.slug && (await this.teacherRepository.existsBySlug(slug, id))) {
        throw new EntityAlreadyExistsException('Teacher', 'slug', slug);
      }
    }

    const teacher = await this.teacherRepository.update(id, {
      slug,
      fullName: dto.fullName?.trim(),
      position: dto.position ? stripLocalizedHtml(normalizeLocalizedText(dto.position)) : undefined,
      bio: dto.bio ? sanitizeLocalizedRichText(normalizeLocalizedText(dto.bio)) : undefined,
      photoUrl: dto.photoUrl,
      experienceYears: dto.experienceYears,
      skills: dto.skills,
      socials: dto.socials,
      sortOrder: dto.sortOrder,
      isActive: dto.isActive,
      courseIds: dto.courseIds,
    });

    return TeacherMapper.toResponse(teacher);
  }
}

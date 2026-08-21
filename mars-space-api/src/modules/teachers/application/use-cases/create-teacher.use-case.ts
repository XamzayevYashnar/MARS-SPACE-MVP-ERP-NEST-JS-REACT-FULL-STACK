import { Injectable } from '@nestjs/common';
import { EntityAlreadyExistsException } from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import {
  sanitizeLocalizedRichText,
  stripLocalizedHtml,
} from '../../../../common/utils/sanitize-html.util';
import { generateUniqueSlug, slugify } from '../../../../common/utils/slugify.util';
import { TeacherRepository } from '../../domain/repositories/teacher.repository';
import { CreateTeacherDto, TeacherResponseDto } from '../dto/teacher.dto';
import { TeacherMapper } from '../mappers/teacher.mapper';

@Injectable()
export class CreateTeacherUseCase {
  constructor(private readonly teacherRepository: TeacherRepository) {}

  async execute(dto: CreateTeacherDto): Promise<TeacherResponseDto> {
    const fullName = dto.fullName.trim();

    const slug = dto.slug
      ? await this.assertSlugFree(slugify(dto.slug))
      : await generateUniqueSlug(fullName, (candidate) =>
          this.teacherRepository.existsBySlug(candidate),
        );

    const teacher = await this.teacherRepository.create({
      slug,
      fullName,
      position: stripLocalizedHtml(normalizeLocalizedText(dto.position)),
      // The bio is displayed as formatted text, so it keeps a safe tag subset.
      bio: dto.bio ? sanitizeLocalizedRichText(normalizeLocalizedText(dto.bio)) : null,
      photoUrl: dto.photoUrl ?? null,
      experienceYears: dto.experienceYears ?? 0,
      skills: dto.skills ?? [],
      socials: dto.socials ?? null,
      sortOrder: dto.sortOrder ?? 0,
      isActive: dto.isActive ?? true,
      courseIds: dto.courseIds,
    });

    return TeacherMapper.toResponse(teacher);
  }

  private async assertSlugFree(slug: string): Promise<string> {
    if (await this.teacherRepository.existsBySlug(slug)) {
      throw new EntityAlreadyExistsException('Teacher', 'slug', slug);
    }
    return slug;
  }
}

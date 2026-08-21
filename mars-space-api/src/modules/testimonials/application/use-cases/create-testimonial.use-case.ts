import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import { stripLocalizedHtml } from '../../../../common/utils/sanitize-html.util';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { CreateTestimonialDto, TestimonialResponseDto } from '../dto/testimonial.dto';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class CreateTestimonialUseCase {
  constructor(
    private readonly testimonialRepository: TestimonialRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute(dto: CreateTestimonialDto): Promise<TestimonialResponseDto> {
    if (dto.courseId && !(await this.courseRepository.existsById(dto.courseId))) {
      throw new EntityNotFoundException('Course', dto.courseId);
    }

    const testimonial = await this.testimonialRepository.create({
      authorName: dto.authorName.trim(),
      // Reviews are quoted verbatim on the site, so they stay plain text.
      content: stripLocalizedHtml(normalizeLocalizedText(dto.content)),
      authorRole: dto.authorRole
        ? stripLocalizedHtml(normalizeLocalizedText(dto.authorRole))
        : null,
      avatarUrl: dto.avatarUrl ?? null,
      courseId: dto.courseId ?? null,
      rating: dto.rating ?? 5,
      videoUrl: dto.videoUrl ?? null,
      isPublished: dto.isPublished ?? false,
      sortOrder: dto.sortOrder ?? 0,
    });

    return TestimonialMapper.toResponse(testimonial);
  }
}

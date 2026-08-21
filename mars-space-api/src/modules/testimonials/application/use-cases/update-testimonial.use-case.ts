import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { normalizeLocalizedText } from '../../../../common/utils/localized-text.util';
import { stripLocalizedHtml } from '../../../../common/utils/sanitize-html.util';
import { CourseRepository } from '../../../courses/domain/repositories/course.repository';
import { TestimonialRepository } from '../../domain/repositories/testimonial.repository';
import { TestimonialResponseDto, UpdateTestimonialDto } from '../dto/testimonial.dto';
import { TestimonialMapper } from '../mappers/testimonial.mapper';

@Injectable()
export class UpdateTestimonialUseCase {
  constructor(
    private readonly testimonialRepository: TestimonialRepository,
    private readonly courseRepository: CourseRepository,
  ) {}

  async execute(id: string, dto: UpdateTestimonialDto): Promise<TestimonialResponseDto> {
    if (!(await this.testimonialRepository.findById(id))) {
      throw new EntityNotFoundException('Testimonial', id);
    }

    if (dto.courseId && !(await this.courseRepository.existsById(dto.courseId))) {
      throw new EntityNotFoundException('Course', dto.courseId);
    }

    const testimonial = await this.testimonialRepository.update(id, {
      authorName: dto.authorName?.trim(),
      content: dto.content ? stripLocalizedHtml(normalizeLocalizedText(dto.content)) : undefined,
      authorRole: dto.authorRole
        ? stripLocalizedHtml(normalizeLocalizedText(dto.authorRole))
        : undefined,
      avatarUrl: dto.avatarUrl,
      courseId: dto.courseId,
      rating: dto.rating,
      videoUrl: dto.videoUrl,
      isPublished: dto.isPublished,
      sortOrder: dto.sortOrder,
    });

    return TestimonialMapper.toResponse(testimonial);
  }
}

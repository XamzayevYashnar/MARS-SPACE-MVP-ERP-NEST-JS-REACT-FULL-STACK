import { Language } from '../../../../common/enums/language.enum';
import { pickLanguage, pickLanguageOptional } from '../../../../common/utils/localized-text.util';
import { Testimonial } from '../../domain/entities/testimonial.entity';
import { TestimonialResponseDto } from '../dto/testimonial.dto';

export class TestimonialMapper {
  static toResponse(testimonial: Testimonial, lang?: Language): TestimonialResponseDto {
    return {
      id: testimonial.id,
      authorName: testimonial.authorName,
      authorRole: lang
        ? pickLanguageOptional(testimonial.authorRole, lang)
        : testimonial.authorRole,
      avatarUrl: testimonial.avatarUrl,
      courseId: testimonial.courseId,
      course: testimonial.course
        ? {
            id: testimonial.course.id,
            slug: testimonial.course.slug,
            title: lang ? pickLanguage(testimonial.course.title, lang) : testimonial.course.title,
          }
        : null,
      rating: testimonial.rating,
      content: lang ? pickLanguage(testimonial.content, lang) : testimonial.content,
      videoUrl: testimonial.videoUrl,
      isPublished: testimonial.isPublished,
      sortOrder: testimonial.sortOrder,
      createdAt: testimonial.createdAt,
      updatedAt: testimonial.updatedAt,
    };
  }

  static toResponseList(testimonials: Testimonial[], lang?: Language): TestimonialResponseDto[] {
    return testimonials.map((testimonial) => TestimonialMapper.toResponse(testimonial, lang));
  }
}

import { Language } from '../../../../common/enums/language.enum';
import {
  pickLanguage,
  pickLanguageList,
  pickLanguageOptional,
} from '../../../../common/utils/localized-text.util';
import {
  Course,
  CourseCategorySummary,
  CourseGroupSummary,
  CourseTeacherSummary,
  CourseTestimonialSummary,
} from '../../domain/entities/course.entity';
import { CoursePrice } from '../../domain/value-objects/course-price.vo';
import {
  CourseCategorySummaryDto,
  CourseGroupSummaryDto,
  CoursePriceDto,
  CourseResponseDto,
  CourseTeacherSummaryDto,
  CourseTestimonialSummaryDto,
} from '../dto/course.dto';

export class CourseMapper {
  static toResponse(course: Course, lang?: Language): CourseResponseDto {
    return {
      id: course.id,
      slug: course.slug,
      title: lang ? pickLanguage(course.title, lang) : course.title,
      shortDescription: lang
        ? pickLanguage(course.shortDescription, lang)
        : course.shortDescription,
      description: lang ? pickLanguage(course.description, lang) : course.description,
      outcomes: lang ? pickLanguageList(course.outcomes, lang) : course.outcomes,
      requirements: lang ? pickLanguageList(course.requirements, lang) : course.requirements,
      // The syllabus keeps its full localised shape in both modes: flattening a
      // nested structure would need a parallel DTO for little gain.
      syllabus: course.syllabus,
      categoryId: course.categoryId,
      category: course.category ? CourseMapper.toCategorySummary(course.category, lang) : null,
      level: course.level,
      format: course.format,
      durationMonths: course.durationMonths,
      lessonsPerWeek: course.lessonsPerWeek,
      lessonMinutes: course.lessonMinutes,
      totalLessons: course.totalLessons(),
      price: CourseMapper.toPrice(course.price),
      coverImageUrl: course.coverImageUrl,
      promoVideoUrl: course.promoVideoUrl,
      metaTitle: lang ? pickLanguageOptional(course.metaTitle, lang) : course.metaTitle,
      metaDescription: lang
        ? pickLanguageOptional(course.metaDescription, lang)
        : course.metaDescription,
      isFeatured: course.isFeatured,
      isPublished: course.isPublished,
      sortOrder: course.sortOrder,
      teachers: course.teachers.map((teacher) => CourseMapper.toTeacherSummary(teacher, lang)),
      groups: course.groups.map((group) => CourseMapper.toGroupSummary(group)),
      testimonials: course.testimonials.map((testimonial) =>
        CourseMapper.toTestimonialSummary(testimonial, lang),
      ),
      createdAt: course.createdAt,
      updatedAt: course.updatedAt,
    };
  }

  static toResponseList(courses: Course[], lang?: Language): CourseResponseDto[] {
    return courses.map((course) => CourseMapper.toResponse(course, lang));
  }

  static toPrice(price: CoursePrice): CoursePriceDto {
    return {
      amount: price.amount,
      discountAmount: price.discountAmount,
      effectiveAmount: price.effectiveAmount(),
      discountPercent: price.discountPercent(),
      currency: price.currency,
    };
  }

  static toCategorySummary(
    category: CourseCategorySummary,
    lang?: Language,
  ): CourseCategorySummaryDto {
    return {
      id: category.id,
      slug: category.slug,
      name: lang ? pickLanguage(category.name, lang) : category.name,
      colorHex: category.colorHex,
      iconKey: category.iconKey,
    };
  }

  static toTeacherSummary(teacher: CourseTeacherSummary, lang?: Language): CourseTeacherSummaryDto {
    return {
      id: teacher.id,
      slug: teacher.slug,
      fullName: teacher.fullName,
      position: lang ? pickLanguage(teacher.position, lang) : teacher.position,
      photoUrl: teacher.photoUrl,
    };
  }

  static toGroupSummary(group: CourseGroupSummary): CourseGroupSummaryDto {
    return {
      id: group.id,
      name: group.name,
      startDate: group.startDate,
      weekDays: group.weekDays,
      startTime: group.startTime,
      endTime: group.endTime,
      status: group.status,
      capacity: group.capacity,
      freeSeats: group.freeSeats,
    };
  }

  static toTestimonialSummary(
    testimonial: CourseTestimonialSummary,
    lang?: Language,
  ): CourseTestimonialSummaryDto {
    return {
      id: testimonial.id,
      authorName: testimonial.authorName,
      authorRole: lang
        ? pickLanguageOptional(testimonial.authorRole, lang)
        : testimonial.authorRole,
      avatarUrl: testimonial.avatarUrl,
      rating: testimonial.rating,
      content: lang ? pickLanguage(testimonial.content, lang) : testimonial.content,
    };
  }
}

import { Language } from '../../../../common/enums/language.enum';
import { pickLanguage, pickLanguageOptional } from '../../../../common/utils/localized-text.util';
import { Teacher, TeacherCourseSummary } from '../../domain/entities/teacher.entity';
import { TeacherCourseSummaryDto, TeacherResponseDto } from '../dto/teacher.dto';

export class TeacherMapper {
  static toResponse(teacher: Teacher, lang?: Language): TeacherResponseDto {
    return {
      id: teacher.id,
      slug: teacher.slug,
      fullName: teacher.fullName,
      position: lang ? pickLanguage(teacher.position, lang) : teacher.position,
      bio: lang ? pickLanguageOptional(teacher.bio, lang) : teacher.bio,
      photoUrl: teacher.photoUrl,
      experienceYears: teacher.experienceYears,
      skills: teacher.skills,
      socials: teacher.socials,
      sortOrder: teacher.sortOrder,
      isActive: teacher.isActive,
      courses: teacher.courses.map((course) => TeacherMapper.toCourseSummary(course, lang)),
      createdAt: teacher.createdAt,
      updatedAt: teacher.updatedAt,
    };
  }

  static toResponseList(teachers: Teacher[], lang?: Language): TeacherResponseDto[] {
    return teachers.map((teacher) => TeacherMapper.toResponse(teacher, lang));
  }

  static toCourseSummary(course: TeacherCourseSummary, lang?: Language): TeacherCourseSummaryDto {
    return {
      id: course.id,
      slug: course.slug,
      title: lang ? pickLanguage(course.title, lang) : course.title,
      coverImageUrl: course.coverImageUrl,
    };
  }
}

import { Language } from '../../../../common/enums/language.enum';
import { pickLanguage } from '../../../../common/utils/localized-text.util';
import { Group } from '../../domain/entities/group.entity';
import { GroupResponseDto } from '../dto/group.dto';

export class GroupMapper {
  static toResponse(group: Group, lang?: Language): GroupResponseDto {
    return {
      id: group.id,
      name: group.name,
      courseId: group.courseId,
      course: group.course
        ? {
            id: group.course.id,
            slug: group.course.slug,
            title: lang ? pickLanguage(group.course.title, lang) : group.course.title,
          }
        : null,
      teacherId: group.teacherId,
      teacher: group.teacher
        ? {
            id: group.teacher.id,
            slug: group.teacher.slug,
            fullName: group.teacher.fullName,
            photoUrl: group.teacher.photoUrl,
          }
        : null,
      startDate: group.startDate,
      endDate: group.endDate,
      weekDays: group.weekDays,
      startTime: group.startTime,
      endTime: group.endTime,
      roomName: group.roomName,
      capacity: group.capacity,
      activeStudentsCount: group.activeStudentsCount,
      freeSeats: group.freeSeats(),
      status: group.status,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  static toResponseList(groups: Group[], lang?: Language): GroupResponseDto[] {
    return groups.map((group) => GroupMapper.toResponse(group, lang));
  }
}

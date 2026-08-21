import { Student } from '../../domain/entities/student.entity';
import { StudentResponseDto } from '../dto/student.dto';

export class StudentMapper {
  static toResponse(student: Student): StudentResponseDto {
    return {
      id: student.id,
      fullName: student.fullName,
      phone: student.phone,
      email: student.email,
      birthDate: student.birthDate,
      groupId: student.groupId,
      group: student.group
        ? {
            id: student.group.id,
            name: student.group.name,
            courseId: student.group.courseId,
            courseTitle: student.group.courseTitle,
          }
        : null,
      status: student.status,
      note: student.note,
      enrolledAt: student.enrolledAt,
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  static toResponseList(students: Student[]): StudentResponseDto[] {
    return students.map((student) => StudentMapper.toResponse(student));
  }
}

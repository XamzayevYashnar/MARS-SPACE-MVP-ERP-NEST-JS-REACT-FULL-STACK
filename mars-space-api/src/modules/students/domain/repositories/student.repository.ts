import { Paginated } from '../../../../common/interfaces';
import {
  CreateStudentData,
  Student,
  StudentQuery,
  UpdateStudentData,
} from '../entities/student.entity';

export abstract class StudentRepository {
  abstract findMany(query: StudentQuery): Promise<Paginated<Student>>;
  abstract findById(id: string): Promise<Student | null>;
  abstract findByPhone(phone: string): Promise<Student | null>;
  abstract create(data: CreateStudentData): Promise<Student>;
  abstract update(id: string, data: UpdateStudentData): Promise<Student>;
  abstract delete(id: string): Promise<void>;

  /**
   * Creates a student while re-checking the target group's free seats inside
   * the same transaction.
   *
   * Doing the check in the use case alone would leave a race: two managers
   * enrolling at once could both read "one seat left". The port therefore
   * exposes the atomic operation, and the implementation owns the locking.
   */
  abstract createWithCapacityCheck(data: CreateStudentData & { groupId: string }): Promise<Student>;

  /** Same guarantee for moving a student between groups. */
  abstract moveToGroupWithCapacityCheck(id: string, groupId: string): Promise<Student>;
}

import { Paginated } from '../../../../common/interfaces';
import {
  CreateTeacherData,
  Teacher,
  TeacherQuery,
  UpdateTeacherData,
} from '../entities/teacher.entity';

export abstract class TeacherRepository {
  abstract findMany(query: TeacherQuery): Promise<Paginated<Teacher>>;
  abstract findById(id: string): Promise<Teacher | null>;
  /** `activeOnly` keeps a hidden teacher out of the public detail route. */
  abstract findBySlug(slug: string, activeOnly: boolean): Promise<Teacher | null>;
  abstract existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreateTeacherData): Promise<Teacher>;
  abstract update(id: string, data: UpdateTeacherData): Promise<Teacher>;
  abstract delete(id: string): Promise<void>;
  /** Groups still led by this teacher — checked before a hard delete. */
  abstract countGroups(id: string): Promise<number>;
  abstract reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void>;
  abstract existsById(id: string): Promise<boolean>;
}

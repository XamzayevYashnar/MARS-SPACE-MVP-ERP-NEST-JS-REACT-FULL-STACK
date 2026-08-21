import { Paginated } from '../../../../common/interfaces';
import { Course, CourseQuery, CreateCourseData, UpdateCourseData } from '../entities/course.entity';

export abstract class CourseRepository {
  abstract findMany(query: CourseQuery): Promise<Paginated<Course>>;
  /** Home-page carousel: published + featured, ordered by `sortOrder`. */
  abstract findFeatured(limit: number): Promise<Course[]>;
  abstract findById(id: string): Promise<Course | null>;
  /**
   * `publishedOnly` is what makes an unpublished course a 404 on the public
   * detail route (§6.4.4). The detail query also loads category, teachers,
   * open groups and published testimonials.
   */
  abstract findBySlug(slug: string, publishedOnly: boolean): Promise<Course | null>;
  abstract existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreateCourseData): Promise<Course>;
  abstract update(id: string, data: UpdateCourseData): Promise<Course>;
  abstract delete(id: string): Promise<void>;
  abstract countGroups(id: string): Promise<number>;
  abstract existsById(id: string): Promise<boolean>;
}

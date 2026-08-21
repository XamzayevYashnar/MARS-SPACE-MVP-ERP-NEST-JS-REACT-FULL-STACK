import { Paginated } from '../../../../common/interfaces';
import {
  Category,
  CategoryQuery,
  CreateCategoryData,
  UpdateCategoryData,
} from '../entities/category.entity';

export abstract class CategoryRepository {
  abstract findMany(query: CategoryQuery): Promise<Paginated<Category>>;
  abstract findById(id: string): Promise<Category | null>;
  abstract findBySlug(slug: string, activeOnly: boolean): Promise<Category | null>;
  abstract existsBySlug(slug: string, excludeId?: string): Promise<boolean>;
  abstract create(data: CreateCategoryData): Promise<Category>;
  abstract update(id: string, data: UpdateCategoryData): Promise<Category>;
  abstract delete(id: string): Promise<void>;
  /** Guards the delete rule of §6.4.5 — a category with courses stays. */
  abstract countCourses(id: string): Promise<number>;
  abstract reorder(items: Array<{ id: string; sortOrder: number }>): Promise<void>;
}

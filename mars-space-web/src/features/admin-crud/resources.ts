import { endpoints } from '@/shared/api/endpoints';
import { queryKeys } from '@/shared/api/query-keys';
import type { Category } from '@/entities/category/types';
import type { Course } from '@/entities/course/types';
import type { Teacher } from '@/entities/teacher/types';
import type { Group } from '@/entities/group/types';
import type { Student } from '@/entities/student/types';
import type { Post } from '@/entities/post/types';
import type { Testimonial } from '@/entities/testimonial/types';
import type { UserRole } from '@/shared/types/common.types';
import { createCrudApi, createCrudHooks } from './crud';

export interface AdminUser {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  role: UserRole;
  avatarUrl: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessage {
  id: string;
  fullName: string;
  email: string | null;
  phone: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

function resource<T, TCreate, TUpdate = Partial<TCreate>>(
  listUrl: string,
  itemUrl: (id: string) => string,
  keys: (typeof queryKeys.admin)[keyof typeof queryKeys.admin],
) {
  const cfg = { listUrl, itemUrl, keys };
  const api = createCrudApi<T, TCreate, TUpdate>(cfg);
  return { api, ...createCrudHooks<T, TCreate, TUpdate>(cfg, api) };
}

export const categoriesResource = resource<Category, Partial<Category>>(
  endpoints.admin.categories,
  endpoints.admin.category,
  queryKeys.admin.categories,
);
export const coursesResource = resource<Course, Record<string, unknown>>(
  endpoints.admin.courses,
  endpoints.admin.course,
  queryKeys.admin.courses,
);
export const teachersResource = resource<Teacher, Record<string, unknown>>(
  endpoints.admin.teachers,
  endpoints.admin.teacher,
  queryKeys.admin.teachers,
);
export const groupsResource = resource<Group, Record<string, unknown>>(
  endpoints.admin.groups,
  endpoints.admin.group,
  queryKeys.admin.groups,
);
export const studentsResource = resource<Student, Record<string, unknown>>(
  endpoints.admin.students,
  endpoints.admin.student,
  queryKeys.admin.students,
);
export const postsResource = resource<Post, Record<string, unknown>>(
  endpoints.admin.posts,
  endpoints.admin.post,
  queryKeys.admin.posts,
);
export const testimonialsResource = resource<Testimonial, Record<string, unknown>>(
  endpoints.admin.testimonials,
  endpoints.admin.testimonial,
  queryKeys.admin.testimonials,
);
export const usersResource = resource<AdminUser, Record<string, unknown>>(
  endpoints.admin.users,
  endpoints.admin.user,
  queryKeys.admin.users,
);
export const messagesResource = resource<AdminMessage, never>(
  endpoints.admin.messages,
  endpoints.admin.message,
  queryKeys.admin.messages,
);

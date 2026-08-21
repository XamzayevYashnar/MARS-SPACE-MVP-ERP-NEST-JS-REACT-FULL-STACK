/**
 * Centralised query-key factory (spec §7.4). Every hook derives its key here so
 * invalidation targets the narrowest relevant set.
 */
export const queryKeys = {
  categories: {
    all: ['categories'] as const,
    list: () => [...queryKeys.categories.all, 'list'] as const,
  },
  courses: {
    all: ['courses'] as const,
    list: (filters?: object) =>
      [...queryKeys.courses.all, 'list', filters ?? {}] as const,
    featured: () => [...queryKeys.courses.all, 'featured'] as const,
    detail: (slug: string) => [...queryKeys.courses.all, 'detail', slug] as const,
  },
  teachers: {
    all: ['teachers'] as const,
    list: (filters?: object) =>
      [...queryKeys.teachers.all, 'list', filters ?? {}] as const,
    detail: (slug: string) => [...queryKeys.teachers.all, 'detail', slug] as const,
  },
  groups: {
    all: ['groups'] as const,
    upcoming: (courseId?: string) => [...queryKeys.groups.all, 'upcoming', courseId ?? null] as const,
    list: (filters?: object) =>
      [...queryKeys.groups.all, 'list', filters ?? {}] as const,
  },
  posts: {
    all: ['posts'] as const,
    list: (filters?: object) =>
      [...queryKeys.posts.all, 'list', filters ?? {}] as const,
    detail: (slug: string) => [...queryKeys.posts.all, 'detail', slug] as const,
  },
  testimonials: {
    all: ['testimonials'] as const,
    list: (filters?: object) =>
      [...queryKeys.testimonials.all, 'list', filters ?? {}] as const,
  },
  settings: {
    all: ['settings'] as const,
    bundle: () => [...queryKeys.settings.all, 'bundle'] as const,
  },
  leads: {
    all: ['leads'] as const,
    list: (filters?: object) =>
      [...queryKeys.leads.all, 'list', filters ?? {}] as const,
    detail: (id: string) => [...queryKeys.leads.all, 'detail', id] as const,
  },
  students: {
    all: ['students'] as const,
    list: (filters?: object) =>
      [...queryKeys.students.all, 'list', filters ?? {}] as const,
  },
  auth: {
    me: ['auth', 'me'] as const,
  },
  statistics: {
    overview: ['statistics', 'overview'] as const,
  },
  /** Admin caches are kept separate from public ones (they include drafts). */
  admin: adminKeys([
    'categories',
    'courses',
    'teachers',
    'groups',
    'students',
    'leads',
    'posts',
    'testimonials',
    'messages',
    'users',
  ]),
} as const;

type AdminEntity =
  | 'categories'
  | 'courses'
  | 'teachers'
  | 'groups'
  | 'students'
  | 'leads'
  | 'posts'
  | 'testimonials'
  | 'messages'
  | 'users';

interface AdminKeySet {
  all: readonly [string, string];
  list: (filters?: object) => readonly [string, string, string, object];
  detail: (id: string) => readonly [string, string, string, string];
}

function adminKeys<T extends string>(entities: readonly T[]): Record<T, AdminKeySet> {
  const out = {} as Record<T, AdminKeySet>;
  for (const entity of entities) {
    out[entity] = {
      all: ['admin', entity] as const,
      list: (filters?: object) => ['admin', entity, 'list', filters ?? {}] as const,
      detail: (id: string) => ['admin', entity, 'detail', id] as const,
    };
  }
  return out;
}

// Exported for typing the CRUD factory.
export type { AdminEntity, AdminKeySet };

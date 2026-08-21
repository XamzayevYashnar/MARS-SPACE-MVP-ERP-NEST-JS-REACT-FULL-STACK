import { http, HttpResponse, delay } from 'msw';
import { env } from '@/shared/config/env';
import { localize } from '@/shared/lib/localize';
import type { PaginationMeta } from '@/shared/types/api.types';
import {
  categories,
  courses,
  mockUser,
  posts,
  settings,
  teachers,
  testimonials,
  upcomingGroups,
} from './data';

const base = env.VITE_API_URL;
const url = (path: string) => `${base}${path}`;

function ok<T>(data: T, meta?: PaginationMeta, status = 200) {
  return HttpResponse.json(
    {
      success: true,
      statusCode: status,
      data,
      ...(meta ? { meta } : {}),
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function errorResponse(code: string, message: string, status: number) {
  return HttpResponse.json(
    {
      success: false,
      statusCode: status,
      error: { code, message },
      path: '',
      timestamp: new Date().toISOString(),
    },
    { status },
  );
}

function paginate<T>(items: T[], page: number, limit: number): { slice: T[]; meta: PaginationMeta } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  return {
    slice: items.slice(start, start + limit),
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
}

export const handlers = [
  // ── Public content ──────────────────────────────────────────────
  http.get(url('/categories'), async () => {
    await delay(150);
    return ok(categories);
  }),

  http.get(url('/courses/featured'), async () => {
    await delay(150);
    return ok(courses.filter((c) => c.isFeatured));
  }),

  http.get(url('/courses/:slug'), async ({ params }) => {
    await delay(150);
    const course = courses.find((c) => c.slug === params.slug);
    return course ? ok(course) : errorResponse('NOT_FOUND', 'Course not found', 404);
  }),

  http.get(url('/courses'), async ({ request }) => {
    await delay(200);
    const q = new URL(request.url).searchParams;
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 12);
    const categorySlug = q.get('categorySlug');
    const level = q.get('level');
    const format = q.get('format');
    const search = q.get('search')?.toLowerCase();

    let filtered = courses.filter((c) => c.isPublished);
    if (categorySlug) filtered = filtered.filter((c) => c.category?.slug === categorySlug);
    if (level) filtered = filtered.filter((c) => c.level === level);
    if (format) filtered = filtered.filter((c) => c.format === format);
    if (search)
      filtered = filtered.filter((c) => localize(c.title, 'uz').toLowerCase().includes(search));

    const { slice, meta } = paginate(filtered, page, limit);
    return ok(slice, meta);
  }),

  http.get(url('/teachers/:slug'), async ({ params }) => {
    await delay(150);
    const teacher = teachers.find((t) => t.slug === params.slug);
    if (!teacher) return errorResponse('NOT_FOUND', 'Teacher not found', 404);
    const taught = courses
      .filter((c) => c.teachers.some((t) => t.id === teacher.id))
      .map((c) => ({ id: c.id, slug: c.slug, title: c.title, coverImageUrl: c.coverImageUrl }));
    return ok({ ...teacher, courses: taught });
  }),

  http.get(url('/teachers'), async ({ request }) => {
    await delay(150);
    const q = new URL(request.url).searchParams;
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 12);
    const { slice, meta } = paginate(teachers, page, limit);
    return ok(slice, meta);
  }),

  http.get(url('/groups/upcoming'), async ({ request }) => {
    await delay(150);
    const courseId = new URL(request.url).searchParams.get('courseId');
    const rows = courseId ? upcomingGroups.filter((g) => g.courseId === courseId) : upcomingGroups;
    return ok(rows);
  }),

  http.get(url('/posts/:slug'), async ({ params }) => {
    await delay(150);
    const post = posts.find((p) => p.slug === params.slug);
    return post ? ok(post) : errorResponse('NOT_FOUND', 'Post not found', 404);
  }),

  http.get(url('/posts'), async ({ request }) => {
    await delay(150);
    const q = new URL(request.url).searchParams;
    const page = Number(q.get('page') ?? 1);
    const limit = Number(q.get('limit') ?? 9);
    const tag = q.get('tag');
    let rows = posts.filter((p) => p.isPublished);
    if (tag) rows = rows.filter((p) => p.tags.includes(tag));
    const { slice, meta } = paginate(rows, page, limit);
    return ok(slice, meta);
  }),

  http.get(url('/testimonials'), async ({ request }) => {
    await delay(150);
    const courseId = new URL(request.url).searchParams.get('courseId');
    const rows = courseId ? testimonials.filter((t) => t.courseId === courseId) : testimonials;
    return ok(rows);
  }),

  http.get(url('/settings'), async () => {
    await delay(100);
    return ok(settings);
  }),

  // ── Public forms ────────────────────────────────────────────────
  http.post(url('/leads'), async ({ request }) => {
    await delay(400);
    const body = (await request.json()) as { fullName?: string; phone?: string };
    if (!body.phone || !/^\+998\d{9}$/.test(body.phone)) {
      return HttpResponse.json(
        {
          success: false,
          statusCode: 422,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: [{ field: 'phone', message: 'validation.phone.invalid' }],
          },
          path: '/leads',
          timestamp: new Date().toISOString(),
        },
        { status: 422 },
      );
    }
    return ok({ id: 'lead_new', ...body, status: 'NEW' }, undefined, 201);
  }),

  http.post(url('/contact'), async () => {
    await delay(400);
    return ok({ id: 'msg_new' }, undefined, 201);
  }),

  // ── Auth ────────────────────────────────────────────────────────
  http.post(url('/auth/login'), async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as { email?: string; password?: string };
    if (body.email === mockUser.email && body.password === 'password') {
      return ok({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
        expiresIn: 900,
        tokenType: 'Bearer',
        user: mockUser,
      });
    }
    return errorResponse('INVALID_CREDENTIALS', 'Invalid email or password', 401);
  }),

  http.post(url('/auth/refresh'), async () => {
    await delay(150);
    return ok({ accessToken: 'mock-access-token-refreshed', expiresIn: 900, tokenType: 'Bearer' });
  }),

  http.post(url('/auth/logout'), () => ok({ message: 'ok' })),

  http.get(url('/auth/me'), () => ok(mockUser)),
];

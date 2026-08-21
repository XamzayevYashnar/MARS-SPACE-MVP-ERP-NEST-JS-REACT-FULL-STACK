import { http, HttpResponse, delay } from 'msw';
import { env } from '@/shared/config/env';
import type { PaginationMeta } from '@/shared/types/api.types';
import {
  adminLeads,
  adminMessages,
  adminStudents,
  adminUsers,
  categories,
  courses,
  posts,
  settings,
  teachers,
  testimonials,
  upcomingGroups,
} from './data';

const base = env.VITE_API_URL;
const u = (path: string) => `${base}${path}`;

function ok<T>(data: T, meta?: PaginationMeta, status = 200) {
  return HttpResponse.json(
    { success: true, statusCode: status, data, ...(meta ? { meta } : {}), timestamp: new Date().toISOString() },
    { status },
  );
}

function page<T>(items: T[], q: URLSearchParams) {
  const p = Number(q.get('page') ?? 1);
  const limit = Number(q.get('limit') ?? 20);
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const meta: PaginationMeta = {
    page: p,
    limit,
    total,
    totalPages,
    hasNext: p < totalPages,
    hasPrev: p > 1,
  };
  return { slice: items.slice((p - 1) * limit, (p - 1) * limit + limit), meta };
}

function listHandler<T>(path: string, items: () => T[]) {
  return http.get(u(path), async ({ request }) => {
    await delay(150);
    const { slice, meta } = page(items(), new URLSearchParams(new URL(request.url).search));
    return ok(slice, meta);
  });
}

/** Generic create/update/delete echo for a CRUD resource. */
function crudMutations(path: string) {
  return [
    http.post(u(path), async ({ request }) => {
      await delay(200);
      const body = (await request.json()) as Record<string, unknown>;
      return ok({ id: `new_${Date.now()}`, ...body }, undefined, 201);
    }),
    http.patch(u(`${path}/:id`), async ({ params, request }) => {
      await delay(200);
      const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
      return ok({ id: params.id, ...body });
    }),
    http.delete(u(`${path}/:id`), async () => {
      await delay(150);
      return ok(null, undefined, 200);
    }),
  ];
}

export const adminHandlers = [
  // Statistics
  http.get(u('/admin/statistics/overview'), async () => {
    await delay(200);
    return ok({
      totals: { courses: courses.length, activeGroups: upcomingGroups.length, students: adminStudents.length, leadsThisMonth: adminLeads.length },
      leadsByStatus: {
        NEW: adminLeads.filter((l) => l.status === 'NEW').length,
        IN_PROGRESS: adminLeads.filter((l) => l.status === 'IN_PROGRESS').length,
        CONTACTED: adminLeads.filter((l) => l.status === 'CONTACTED').length,
        ENROLLED: adminLeads.filter((l) => l.status === 'ENROLLED').length,
        REJECTED: adminLeads.filter((l) => l.status === 'REJECTED').length,
      },
      leadsTrend: Array.from({ length: 30 }).map((_, i) => ({
        date: `08-${String(i + 1).padStart(2, '0')}`,
        count: Math.round(3 + Math.sin(i / 3) * 2 + (i % 5)),
      })),
      topCourses: courses.slice(0, 3).map((c, i) => ({ courseId: c.id, title: c.title, leadsCount: 12 - i * 3 })),
      recentLeads: adminLeads.slice(0, 5),
    });
  }),

  // Leads
  http.get(u('/admin/leads'), async ({ request }) => {
    await delay(150);
    const q = new URL(request.url).searchParams;
    let rows = [...adminLeads];
    const status = q.get('status');
    if (status) rows = rows.filter((l) => l.status === status);
    const { slice, meta } = page(rows, q);
    return ok(slice, meta);
  }),
  http.get(u('/admin/leads/:id'), async ({ params }) => {
    await delay(120);
    const lead = adminLeads.find((l) => l.id === params.id);
    return lead ? ok(lead) : HttpResponse.json({ success: false, statusCode: 404, error: { code: 'NOT_FOUND', message: 'Not found' }, path: '', timestamp: new Date().toISOString() }, { status: 404 });
  }),
  http.patch(u('/admin/leads/:id/status'), async ({ params, request }) => {
    await delay(150);
    const { status } = (await request.json()) as { status: string };
    const lead = adminLeads.find((l) => l.id === params.id);
    if (lead) lead.status = status;
    return ok(lead);
  }),
  http.patch(u('/admin/leads/:id/assign'), async ({ params, request }) => {
    await delay(150);
    const { assignedToId } = (await request.json()) as { assignedToId: string | null };
    const lead = adminLeads.find((l) => l.id === params.id);
    if (lead) {
      lead.assignedToId = assignedToId;
      lead.assignedTo = assignedToId ? { id: assignedToId, fullName: adminUsers.find((usr) => usr.id === assignedToId)?.fullName ?? 'User', avatarUrl: null } : null;
    }
    return ok(lead);
  }),
  http.patch(u('/admin/leads/:id/note'), async ({ params, request }) => {
    await delay(150);
    const { note } = (await request.json()) as { note: string };
    const lead = adminLeads.find((l) => l.id === params.id);
    if (lead) lead.adminNote = note;
    return ok(lead);
  }),
  http.post(u('/admin/leads/:id/convert'), async ({ params }) => {
    await delay(250);
    const lead = adminLeads.find((l) => l.id === params.id);
    if (lead) lead.status = 'ENROLLED';
    return ok({ lead, studentId: `std_${Date.now()}` }, undefined, 201);
  }),
  http.delete(u('/admin/leads/:id'), async ({ params }) => {
    await delay(150);
    const idx = adminLeads.findIndex((l) => l.id === params.id);
    if (idx >= 0) adminLeads.splice(idx, 1);
    return ok(null);
  }),

  // CRUD lists
  listHandler('/admin/categories', () => categories),
  listHandler('/admin/courses', () => courses),
  listHandler('/admin/teachers', () => teachers),
  listHandler('/admin/groups', () => upcomingGroups),
  listHandler('/admin/students', () => adminStudents),
  listHandler('/admin/posts', () => posts),
  listHandler('/admin/testimonials', () => testimonials),
  listHandler('/admin/messages', () => adminMessages),
  listHandler('/admin/users', () => adminUsers),

  // CRUD detail (by id) for edit forms
  http.get(u('/admin/courses/:id'), async ({ params }) => {
    await delay(120);
    return ok(courses.find((c) => c.id === params.id) ?? courses[0]);
  }),
  http.get(u('/admin/categories/:id'), async ({ params }) => {
    await delay(120);
    return ok(categories.find((c) => c.id === params.id) ?? categories[0]);
  }),
  http.get(u('/admin/teachers/:id'), async ({ params }) => {
    await delay(120);
    return ok(teachers.find((t) => t.id === params.id) ?? teachers[0]);
  }),
  http.get(u('/admin/posts/:id'), async ({ params }) => {
    await delay(120);
    return ok(posts.find((p) => p.id === params.id) ?? posts[0]);
  }),

  // CRUD mutations
  ...crudMutations('/admin/categories'),
  ...crudMutations('/admin/courses'),
  ...crudMutations('/admin/teachers'),
  ...crudMutations('/admin/groups'),
  ...crudMutations('/admin/students'),
  ...crudMutations('/admin/posts'),
  ...crudMutations('/admin/testimonials'),
  ...crudMutations('/admin/users'),

  // Toggles
  http.patch(u('/admin/courses/:id/publish'), async ({ request }) => ok((await request.json()) as object)),
  http.patch(u('/admin/courses/:id/feature'), async ({ request }) => ok((await request.json()) as object)),
  http.patch(u('/admin/posts/:id/publish'), async ({ request }) => ok((await request.json()) as object)),
  http.patch(u('/admin/testimonials/:id/publish'), async ({ request }) => ok((await request.json()) as object)),
  http.patch(u('/admin/users/:id/status'), async ({ request }) => ok((await request.json()) as object)),

  // Messages
  http.patch(u('/admin/messages/:id/read'), ({ params }) => {
    const msg = adminMessages.find((m) => m.id === params.id);
    if (msg) msg.isRead = true;
    return ok(msg);
  }),
  http.delete(u('/admin/messages/:id'), ({ params }) => {
    const idx = adminMessages.findIndex((m) => m.id === params.id);
    if (idx >= 0) adminMessages.splice(idx, 1);
    return ok(null);
  }),

  // Settings
  http.get(u('/admin/settings'), () => ok(settings)),
  http.put(u('/admin/settings/:key'), async ({ params, request }) => {
    const value = await request.json();
    return ok({ key: params.key, value, updatedAt: new Date().toISOString() });
  }),

  // Uploads
  http.post(u('/admin/uploads/image'), async () => {
    await delay(300);
    return ok(
      {
        id: `img_${Date.now()}`,
        key: 'mock/image.jpg',
        url: 'https://placehold.co/640x360/141922/E6EDF5?text=Mars+Space',
        originalName: 'image.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: 12345,
        width: 640,
        height: 360,
        createdAt: new Date().toISOString(),
      },
      undefined,
      201,
    );
  }),
];

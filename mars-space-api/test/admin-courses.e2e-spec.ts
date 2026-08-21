import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { SeededFixtures, seedFixtures, TEST_PASSWORD } from './fixtures';
import { createTestApp, resetDatabase, resetThrottler } from './test-app';

describe('Admin course CRUD and role enforcement (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: string;
  let fixtures: SeededFixtures;
  let adminToken: string;
  let managerToken: string;
  let superAdminToken: string;

  beforeAll(async () => {
    ({ app, prisma, api } = await createTestApp());
    await resetDatabase(prisma);
    fixtures = await seedFixtures(prisma);

    [superAdminToken, adminToken, managerToken] = await Promise.all([
      login('e2e-super@marsspace.uz'),
      login('e2e-admin@marsspace.uz'),
      login('e2e-manager@marsspace.uz'),
    ]);
  });

  beforeEach(() => {
    resetThrottler(app);
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  async function login(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post(`${api}/auth/login`)
      .send({ email, password: TEST_PASSWORD })
      .expect(200);

    return response.body.data.accessToken as string;
  }

  const asAdmin = (method: 'get' | 'post' | 'patch' | 'delete', path: string, token = adminToken) =>
    request(app.getHttpServer())[method](`${api}${path}`).set('Authorization', `Bearer ${token}`);

  const courseBody = (overrides: Record<string, unknown> = {}) => ({
    title: { uz: 'Yangi kurs', ru: 'Новый курс', en: 'New course' },
    shortDescription: { uz: 'Qisqa tavsif', ru: 'Кратко', en: 'Short' },
    description: { uz: '<p>Toʻliq tavsif</p>', ru: '', en: '' },
    categoryId: fixtures.categoryId,
    level: 'BEGINNER',
    format: 'OFFLINE',
    durationMonths: 6,
    lessonsPerWeek: 3,
    price: 1_800_000,
    ...overrides,
  });

  describe('role enforcement', () => {
    it('lets a MANAGER reach the leads pipeline', async () => {
      await asAdmin('get', '/admin/leads', managerToken).expect(200);
    });

    it('blocks a MANAGER from the ADMIN-only course routes', async () => {
      const response = await asAdmin('get', '/admin/courses', managerToken).expect(403);

      expect(response.body).toMatchObject({ success: false, error: { code: 'FORBIDDEN' } });
    });

    it('blocks an ADMIN from the SUPER_ADMIN-only user routes', async () => {
      const response = await asAdmin('get', '/admin/users', adminToken).expect(403);

      expect(response.body.error.code).toBe('FORBIDDEN');
    });

    it('lets a SUPER_ADMIN reach everything', async () => {
      await asAdmin('get', '/admin/users', superAdminToken).expect(200);
      await asAdmin('get', '/admin/courses', superAdminToken).expect(200);
      await asAdmin('get', '/admin/leads', superAdminToken).expect(200);
    });

    it('401s an admin route with no token', async () => {
      await request(app.getHttpServer()).get(`${api}/admin/courses`).expect(401);
    });
  });

  describe('full CRUD cycle', () => {
    let createdId: string;
    let createdSlug: string;

    it('creates a course, deriving the slug from title.uz', async () => {
      const response = await asAdmin('post', '/admin/courses').send(courseBody()).expect(201);

      expect(response.body.data).toMatchObject({
        slug: 'yangi-kurs',
        isPublished: false,
        isFeatured: false,
        price: expect.objectContaining({ amount: 1_800_000, effectiveAmount: 1_800_000 }),
      });

      createdId = response.body.data.id;
      createdSlug = response.body.data.slug;
    });

    it('sanitises rich text on the way in', async () => {
      const response = await asAdmin('post', '/admin/courses')
        .send(
          courseBody({
            title: { uz: 'Xavfsizlik sinovi' },
            description: { uz: '<p>Yaxshi</p><script>alert(1)</script>' },
          }),
        )
        .expect(201);

      expect(response.body.data.description.uz).toBe('<p>Yaxshi</p>');
      await asAdmin('delete', `/admin/courses/${response.body.data.id}`).expect(204);
    });

    it('disambiguates a colliding slug with a numeric suffix', async () => {
      const response = await asAdmin('post', '/admin/courses').send(courseBody()).expect(201);

      expect(response.body.data.slug).toBe('yangi-kurs-2');
      await asAdmin('delete', `/admin/courses/${response.body.data.id}`).expect(204);
    });

    it('rejects a discount that is not below the price', async () => {
      await asAdmin('post', '/admin/courses')
        .send(courseBody({ title: { uz: 'Chegirma sinovi' }, price: 1000, discountPrice: 2000 }))
        .expect(400);
    });

    it('404s when the category does not exist', async () => {
      await asAdmin('post', '/admin/courses')
        .send(courseBody({ title: { uz: 'Kategoriyasiz' }, categoryId: 'nonexistent-id' }))
        .expect(404);
    });

    it('reads the course back', async () => {
      const response = await asAdmin('get', `/admin/courses/${createdId}`).expect(200);

      expect(response.body.data.slug).toBe(createdSlug);
    });

    it('updates the course', async () => {
      const response = await asAdmin('patch', `/admin/courses/${createdId}`)
        .send({ durationMonths: 9, title: { uz: 'Yangilangan kurs' } })
        .expect(200);

      expect(response.body.data).toMatchObject({ durationMonths: 9 });
      expect(response.body.data.title.uz).toBe('Yangilangan kurs');
    });

    it('refuses to feature a draft', async () => {
      const response = await asAdmin('patch', `/admin/courses/${createdId}/feature`)
        .send({ isFeatured: true })
        .expect(409);

      expect(response.body.error.code).toBe('CONFLICT');
    });

    it('publishes the course and then allows featuring it', async () => {
      await asAdmin('patch', `/admin/courses/${createdId}/publish`)
        .send({ isPublished: true })
        .expect(200);

      const featured = await asAdmin('patch', `/admin/courses/${createdId}/feature`)
        .send({ isFeatured: true })
        .expect(200);

      expect(featured.body.data).toMatchObject({ isPublished: true, isFeatured: true });
    });

    it('makes the published course visible on the public route', async () => {
      await request(app.getHttpServer()).get(`${api}/courses/${createdSlug}`).expect(200);
    });

    it('unpublishing also clears the featured flag and hides it publicly', async () => {
      const response = await asAdmin('patch', `/admin/courses/${createdId}/publish`)
        .send({ isPublished: false })
        .expect(200);

      expect(response.body.data).toMatchObject({ isPublished: false, isFeatured: false });
      await request(app.getHttpServer()).get(`${api}/courses/${createdSlug}`).expect(404);
    });

    it('deletes the course', async () => {
      await asAdmin('delete', `/admin/courses/${createdId}`).expect(204);
      await asAdmin('get', `/admin/courses/${createdId}`).expect(404);
    });
  });

  describe('delete safety', () => {
    it('refuses to delete a category that still holds courses', async () => {
      const response = await asAdmin('delete', `/admin/categories/${fixtures.categoryId}`).expect(
        409,
      );

      expect(response.body.error.message).toContain('cannot be deleted');
    });

    it('refuses to delete a course that still has groups', async () => {
      const group = await prisma.group.create({
        data: {
          name: 'E2E-DEL-1',
          courseId: fixtures.publishedCourseId,
          startDate: new Date('2026-09-01'),
          startTime: '18:00',
          endTime: '19:30',
        },
      });

      await asAdmin('delete', `/admin/courses/${fixtures.publishedCourseId}`).expect(409);

      await prisma.group.delete({ where: { id: group.id } });
    });
  });
});

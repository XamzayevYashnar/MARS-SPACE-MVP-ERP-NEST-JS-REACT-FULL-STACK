import { INestApplication } from '@nestjs/common';
import { CourseFormat, CourseLevel, Prisma } from '@prisma/client';
import request from 'supertest';
import { PrismaService } from '../src/database/prisma.service';
import { SeededFixtures, seedFixtures } from './fixtures';
import { createTestApp, resetDatabase, resetThrottler } from './test-app';

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

describe('Public content (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let api: string;
  let fixtures: SeededFixtures;

  beforeAll(async () => {
    ({ app, prisma, api } = await createTestApp());
    await resetDatabase(prisma);
    fixtures = await seedFixtures(prisma);

    // A handful of extra published courses, so pagination has something to page.
    for (let index = 0; index < 14; index += 1) {
      await prisma.course.create({
        data: {
          slug: `e2e-filler-${index}`,
          title: json({ uz: `Filler kurs ${index}`, ru: `Курс ${index}`, en: `Course ${index}` }),
          shortDescription: json({ uz: 'Qisqa', ru: 'Кратко', en: 'Short' }),
          description: json({ uz: '<p>Matn</p>', ru: '', en: '' }),
          categoryId: fixtures.categoryId,
          level: index % 2 === 0 ? CourseLevel.BEGINNER : CourseLevel.ADVANCED,
          format: index % 3 === 0 ? CourseFormat.ONLINE : CourseFormat.OFFLINE,
          durationMonths: 3,
          lessonsPerWeek: 2,
          price: new Prisma.Decimal(500_000 + index * 100_000),
          isPublished: true,
          sortOrder: index + 10,
        },
      });
    }
  });

  beforeEach(() => {
    resetThrottler(app);
  });

  afterAll(async () => {
    await resetDatabase(prisma);
    await app.close();
  });

  const get = (path: string) => request(app.getHttpServer()).get(`${api}${path}`);

  describe('GET /courses', () => {
    it('wraps the page in the success envelope with pagination meta', async () => {
      const response = await get('/courses').expect(200);

      expect(response.body).toMatchObject({
        success: true,
        statusCode: 200,
        data: expect.any(Array),
        meta: {
          page: 1,
          limit: 12,
          total: 15,
          totalPages: 2,
          hasNext: true,
          hasPrev: false,
        },
      });
      expect(response.body.data).toHaveLength(12);
    });

    it('serves the second page', async () => {
      const response = await get('/courses?page=2').expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.meta).toMatchObject({ page: 2, hasNext: false, hasPrev: true });
    });

    it('never returns a draft, whatever the parameters', async () => {
      const response = await get('/courses?limit=100').expect(200);

      const slugs = response.body.data.map((course: { slug: string }) => course.slug);
      expect(slugs).not.toContain(fixtures.draftCourseSlug);
      expect(
        response.body.data.every((course: { isPublished: boolean }) => course.isPublished),
      ).toBe(true);
    });

    it('filters by level', async () => {
      const response = await get('/courses?level=ADVANCED&limit=100').expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(
        response.body.data.every((course: { level: string }) => course.level === 'ADVANCED'),
      ).toBe(true);
    });

    it('filters by format', async () => {
      const response = await get('/courses?format=ONLINE&limit=100').expect(200);

      expect(
        response.body.data.every((course: { format: string }) => course.format === 'ONLINE'),
      ).toBe(true);
    });

    it('filters by category slug', async () => {
      const response = await get('/courses?categorySlug=e2e-frontend&limit=100').expect(200);

      expect(response.body.data.length).toBe(15);
    });

    it('filters by price range', async () => {
      const response = await get('/courses?minPrice=600000&maxPrice=900000&limit=100').expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      for (const course of response.body.data as Array<{ price: { amount: number } }>) {
        expect(course.price.amount).toBeGreaterThanOrEqual(600_000);
        expect(course.price.amount).toBeLessThanOrEqual(900_000);
      }
    });

    it('returns localised objects by default and flat strings with ?lang=', async () => {
      const objectForm = await get('/courses?limit=1').expect(200);
      expect(objectForm.body.data[0].title).toEqual(
        expect.objectContaining({ uz: expect.any(String) }),
      );

      const flatForm = await get('/courses?limit=1&lang=ru').expect(200);
      expect(typeof flatForm.body.data[0].title).toBe('string');
    });

    it('rejects an unknown query parameter', async () => {
      await get('/courses?dropTable=users').expect(422);
    });

    it('rejects a limit above the maximum', async () => {
      await get('/courses?limit=5000').expect(422);
    });
  });

  describe('GET /courses/:slug', () => {
    it('returns the detail payload with its relations', async () => {
      const response = await get(`/courses/${fixtures.publishedCourseSlug}`).expect(200);

      expect(response.body.data).toMatchObject({
        slug: fixtures.publishedCourseSlug,
        category: expect.objectContaining({ slug: 'e2e-frontend' }),
        teachers: expect.any(Array),
        groups: expect.any(Array),
        testimonials: expect.any(Array),
      });
    });

    it('404s on an unpublished course, even by direct slug', async () => {
      const response = await get(`/courses/${fixtures.draftCourseSlug}`).expect(404);

      expect(response.body).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } });
    });

    it('404s on a slug that does not exist', async () => {
      await get('/courses/no-such-course').expect(404);
    });
  });

  describe('GET /courses/featured', () => {
    it('returns only featured, published courses', async () => {
      const response = await get('/courses/featured').expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.length).toBeLessThanOrEqual(6);
      for (const course of response.body.data as Array<{
        isFeatured: boolean;
        isPublished: boolean;
      }>) {
        expect(course.isFeatured).toBe(true);
        expect(course.isPublished).toBe(true);
      }
    });
  });

  describe('other public routes', () => {
    it('lists active categories with a published course count', async () => {
      const response = await get('/categories').expect(200);

      expect(response.body.data[0]).toMatchObject({
        slug: 'e2e-frontend',
        coursesCount: 15,
      });
    });

    it('serves the public settings bundle', async () => {
      await prisma.setting.create({
        data: { key: 'contacts', value: json({ email: 'info@marsspace.uz' }) },
      });
      await prisma.setting.create({
        data: { key: 'internal_flags', value: json({ secret: true }) },
      });

      const response = await get('/settings').expect(200);

      expect(response.body.data).toHaveProperty('contacts');
      // Only the whitelisted keys are exposed.
      expect(response.body.data).not.toHaveProperty('internal_flags');
    });

    it('answers the health probe with a database check', async () => {
      const response = await request(app.getHttpServer()).get('/health').expect(200);

      expect(response.body.data.info.database.status).toBe('up');
    });
  });
});

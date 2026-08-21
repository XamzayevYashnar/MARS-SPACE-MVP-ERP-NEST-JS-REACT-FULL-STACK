import { CourseFormat, CourseLevel, Prisma, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../src/database/prisma.service';

export const TEST_PASSWORD = 'TestPass123!';

const ARGON2_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
};

const json = (value: unknown): Prisma.InputJsonValue => value as Prisma.InputJsonValue;

export interface SeededFixtures {
  superAdminId: string;
  adminId: string;
  managerId: string;
  categoryId: string;
  publishedCourseId: string;
  publishedCourseSlug: string;
  draftCourseSlug: string;
}

/**
 * Minimal, explicit fixtures.
 *
 * The e2e suite seeds exactly what it asserts on rather than reusing the demo
 * seeder, so a change to the marketing content cannot break the test suite.
 */
export async function seedFixtures(prisma: PrismaService): Promise<SeededFixtures> {
  const passwordHash = await argon2.hash(TEST_PASSWORD, ARGON2_OPTIONS);

  const [superAdmin, admin, manager] = await Promise.all([
    prisma.user.create({
      data: {
        fullName: 'E2E Super Admin',
        email: 'e2e-super@marsspace.uz',
        passwordHash,
        role: UserRole.SUPER_ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'E2E Admin',
        email: 'e2e-admin@marsspace.uz',
        passwordHash,
        role: UserRole.ADMIN,
      },
    }),
    prisma.user.create({
      data: {
        fullName: 'E2E Manager',
        email: 'e2e-manager@marsspace.uz',
        passwordHash,
        role: UserRole.MANAGER,
      },
    }),
  ]);

  const category = await prisma.category.create({
    data: {
      slug: 'e2e-frontend',
      name: json({ uz: 'Frontend', ru: 'Frontend', en: 'Frontend' }),
      sortOrder: 1,
      isActive: true,
    },
  });

  const published = await prisma.course.create({
    data: {
      slug: 'e2e-published-course',
      title: json({ uz: 'Nashr qilingan kurs', ru: 'Опубликованный курс', en: 'Published course' }),
      shortDescription: json({ uz: 'Qisqa tavsif', ru: '', en: '' }),
      description: json({ uz: '<p>Tavsif</p>', ru: '', en: '' }),
      categoryId: category.id,
      level: CourseLevel.BEGINNER,
      format: CourseFormat.OFFLINE,
      durationMonths: 6,
      lessonsPerWeek: 3,
      price: new Prisma.Decimal(1_500_000),
      isPublished: true,
      isFeatured: true,
      sortOrder: 1,
    },
  });

  await prisma.course.create({
    data: {
      slug: 'e2e-draft-course',
      title: json({ uz: 'Qoralama kurs', ru: '', en: '' }),
      shortDescription: json({ uz: 'Qoralama', ru: '', en: '' }),
      description: json({ uz: '<p>Qoralama</p>', ru: '', en: '' }),
      categoryId: category.id,
      level: CourseLevel.ADVANCED,
      format: CourseFormat.ONLINE,
      durationMonths: 4,
      lessonsPerWeek: 2,
      price: new Prisma.Decimal(2_000_000),
      isPublished: false,
      sortOrder: 2,
    },
  });

  return {
    superAdminId: superAdmin.id,
    adminId: admin.id,
    managerId: manager.id,
    categoryId: category.id,
    publishedCourseId: published.id,
    publishedCourseSlug: 'e2e-published-course',
    draftCourseSlug: 'e2e-draft-course',
  };
}

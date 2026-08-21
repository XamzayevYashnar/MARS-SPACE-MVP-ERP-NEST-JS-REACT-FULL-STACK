import { PrismaClient } from '@prisma/client';
import { config as loadEnv } from 'dotenv';
import { seedAdmins } from '../src/database/seeders/admin.seeder';
import { seedCatalog } from '../src/database/seeders/catalog.seeder';
import { seedDemo } from '../src/database/seeders/demo.seeder';

loadEnv();

const prisma = new PrismaClient();

/**
 * Populates the database with realistic demo content (§9).
 *
 * Every seeder is idempotent — `pnpm db:seed` is safe to run repeatedly, which
 * is what makes it usable as part of `docker compose up`.
 */
async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log('▶ Seeding Mars Space database…');

  const accounts = await seedAdmins(prisma);
  console.log('  ✓ staff accounts');

  const catalog = await seedCatalog(prisma);
  console.log(
    `  ✓ catalogue — ${catalog.categoryIds.length} categories, ${catalog.courseIds.length} courses, ${catalog.teacherIds.length} teachers`,
  );

  const demo = await seedDemo(prisma, accounts, catalog);
  console.log(
    `  ✓ demo data — ${demo.groups} groups, ${demo.students} students, ${demo.leads} leads, ${demo.posts} posts, ${demo.testimonials} testimonials`,
  );

  console.log(`✔ Seeding finished in ${Date.now() - startedAt} ms`);
}

main()
  .catch((error: unknown) => {
    console.error('✖ Seeding failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
 *
 * The demo tier is the exception. `docker-compose.yml` runs this file on every
 * start with `NODE_ENV=production`, so an unguarded `seedDemo` would inject
 * fabricated students, leads and testimonials into a live database and mix them
 * in with real records. It therefore requires an explicit `SEED_DEMO=true`
 * outside development.
 */
function shouldSeedDemo(): boolean {
  if (process.env.SEED_DEMO === 'true') {
    return true;
  }
  if (process.env.SEED_DEMO === 'false') {
    return false;
  }
  return process.env.NODE_ENV !== 'production';
}

async function main(): Promise<void> {
  const startedAt = Date.now();
  console.log('▶ Seeding Mars Space database…');

  const accounts = await seedAdmins(prisma);
  console.log('  ✓ staff accounts');

  const catalog = await seedCatalog(prisma);
  console.log(
    `  ✓ catalogue — ${catalog.categoryIds.length} categories, ${catalog.courseIds.length} courses, ${catalog.teacherIds.length} teachers`,
  );

  if (shouldSeedDemo()) {
    const demo = await seedDemo(prisma, accounts, catalog);
    console.log(
      `  ✓ demo data — ${demo.groups} groups, ${demo.students} students, ${demo.leads} leads, ${demo.posts} posts, ${demo.testimonials} testimonials`,
    );
  } else {
    console.log('  – demo data skipped (production; set SEED_DEMO=true to force it)');
  }

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

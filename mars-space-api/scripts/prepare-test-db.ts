/**
 * Brings the e2e database up to date before the suite runs.
 *
 * Wired as `pretest:e2e`, so `pnpm test:e2e` works on a clean checkout: Prisma
 * creates `mars_space_test` if it is missing and applies every migration. The
 * guard on the database name is what stops a mis-set `.env.test` from
 * migrating — and, through `truncateAll()`, wiping — a development database.
 */
import { execFileSync } from 'node:child_process';
import { config as loadEnv } from 'dotenv';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const ENV_FILE = '.env.test';

function main(): void {
  if (!existsSync(resolve(process.cwd(), ENV_FILE))) {
    console.error(`✖ ${ENV_FILE} is missing. Copy .env.example to ${ENV_FILE} and point`);
    console.error('  DATABASE_URL at a dedicated test database before running the e2e suite.');
    process.exit(1);
  }

  const parsed = loadEnv({ path: ENV_FILE, override: true }).parsed ?? {};
  const databaseUrl = parsed.DATABASE_URL ?? process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(`✖ ${ENV_FILE} does not define DATABASE_URL.`);
    process.exit(1);
  }

  // The e2e suite truncates every table between suites, so it must never be
  // pointed at a database that is not obviously a test one.
  if (!/test/i.test(new URL(databaseUrl).pathname)) {
    console.error('✖ Refusing to prepare a database whose name does not contain "test":');
    console.error(`  ${new URL(databaseUrl).pathname.replace('/', '')}`);
    console.error('  The e2e suite truncates every table, so this guard is deliberate.');
    process.exit(1);
  }

  console.log(`▶ Applying migrations to ${new URL(databaseUrl).pathname.replace('/', '')}…`);

  execFileSync(
    process.execPath,
    [resolve('node_modules/prisma/build/index.js'), 'migrate', 'deploy'],
    { env: { ...process.env, DATABASE_URL: databaseUrl }, stdio: 'inherit' },
  );

  console.log('✔ Test database ready');
}

main();

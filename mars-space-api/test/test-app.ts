import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { Test } from '@nestjs/testing';
import { ThrottlerStorage } from '@nestjs/throttler';
import cookieParser from 'cookie-parser';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/database/prisma.service';

export interface TestContext {
  app: INestApplication;
  prisma: PrismaService;
  /** Base path every request is prefixed with, matching production. */
  api: string;
}

/**
 * Boots the real `AppModule` against the test database.
 *
 * The middleware and pipes mirror `main.ts` so the suite exercises the same
 * validation and envelope behaviour the deployed API has — a bootstrap that
 * skipped them would let a whole class of bug through untested.
 */
export async function createTestApp(): Promise<TestContext> {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

  const app = moduleRef.createNestApplication<NestExpressApplication>({ logger: false });

  // Mirrors main.ts: `exclude` matches exact paths, so the readiness route has
  // to be listed alongside the liveness one.
  app.setGlobalPrefix('api/v1', { exclude: ['health', 'health/ready'] });
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      errorHttpStatusCode: 422,
    }),
  );

  await app.init();

  return { app, prisma: app.get(PrismaService), api: '/api/v1' };
}

/** Empties every table between suites so one spec cannot bleed into the next. */
export async function resetDatabase(prisma: PrismaService): Promise<void> {
  await prisma.truncateAll();
}

/**
 * Clears the in-memory throttler counters.
 *
 * The rate limits are real and are asserted by their own spec; every other
 * spec resets them between cases so that a suite of thirty logins does not
 * start failing at the sixth for reasons unrelated to what it tests.
 */
export function resetThrottler(app: INestApplication): void {
  const storage = app.get<ThrottlerStorage>(ThrottlerStorage, { strict: false });

  // `ThrottlerStorageService` keeps its counters in a private `_storage` Map,
  // with pending expiry timers alongside it. Both have to go, or a cleared
  // counter is re-expired by a stale timer mid-suite.
  const internals = storage as unknown as {
    _storage?: Map<string, unknown>;
    timeoutIds?: NodeJS.Timeout[];
  };

  internals._storage?.clear();

  for (const timeout of internals.timeoutIds ?? []) {
    clearTimeout(timeout);
  }
  if (internals.timeoutIds) {
    internals.timeoutIds.length = 0;
  }
}

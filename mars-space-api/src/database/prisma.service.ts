import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, PrismaClient } from '@prisma/client';
import { AppConfig } from '../core/config/app.config';

/**
 * The single `PrismaClient` instance for the process.
 *
 * Only `infrastructure/persistence` classes may inject it — use cases depend on
 * repository ports instead (§3), which is what keeps the application layer free
 * of ORM concepts and unit-testable without a database.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(configService: ConfigService) {
    const app = configService.getOrThrow<AppConfig>('app');

    super({
      // Warnings and errors are forwarded to the Nest logger in `onModuleInit`.
      // Query logging stays off everywhere: it would echo parameter values —
      // including password hashes and refresh-token digests — into the logs.
      log: [
        { emit: 'event', level: 'warn' },
        { emit: 'event', level: 'error' },
      ],
      errorFormat: app.isProduction ? 'minimal' : 'pretty',
    });
  }

  async onModuleInit(): Promise<void> {
    // `$on` is typed off the log levels declared above.
    this.$on('warn' as never, (event: Prisma.LogEvent) => this.logger.warn(event.message));
    this.$on('error' as never, (event: Prisma.LogEvent) => this.logger.error(event.message));

    await this.$connect();
    this.logger.log('Connected to PostgreSQL');
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Disconnected from PostgreSQL');
  }

  /**
   * Truncates every table. Used exclusively by the e2e suite between runs;
   * it refuses to touch anything outside a test database.
   */
  async truncateAll(): Promise<void> {
    if (process.env.NODE_ENV !== 'test') {
      throw new Error('truncateAll() is only available when NODE_ENV=test');
    }

    const tables = await this.$queryRaw<Array<{ tablename: string }>>(
      Prisma.sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`,
    );

    if (tables.length === 0) {
      return;
    }

    const list = tables.map(({ tablename }) => `"public"."${tablename}"`).join(', ');
    await this.$executeRawUnsafe(`TRUNCATE TABLE ${list} RESTART IDENTITY CASCADE;`);
  }
}

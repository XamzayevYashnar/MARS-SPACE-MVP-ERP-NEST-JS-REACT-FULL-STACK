import { Injectable } from '@nestjs/common';
import { HealthCheckError, HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../database/prisma.service';

/**
 * Terminus indicator that issues a real `SELECT 1`.
 *
 * Checking the connection object alone would report healthy while the database
 * is unreachable, which is exactly the failure a probe exists to catch.
 */
@Injectable()
export class PrismaHealthIndicator extends HealthIndicator {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const startedAt = Date.now();

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return this.getStatus(key, true, { responseTimeMs: Date.now() - startedAt });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'unknown error';
      throw new HealthCheckError(
        'Database check failed',
        this.getStatus(key, false, { message, responseTimeMs: Date.now() - startedAt }),
      );
    }
  }
}

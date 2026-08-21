import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  MemoryHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../common/decorators/auth.decorators';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * `GET /health` — liveness plus a real database round-trip (§6.3).
 * Mounted outside the versioned prefix so orchestrators keep probing it
 * across API versions.
 */
@ApiTags('Public')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
    private readonly memory: MemoryHealthIndicator,
  ) {}

  @Public()
  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe with database and memory checks' })
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prisma.pingCheck('database'),
      () => this.memory.checkHeap('memory_heap', 512 * 1024 * 1024),
      () => this.memory.checkRSS('memory_rss', 1024 * 1024 * 1024),
    ]);
  }
}

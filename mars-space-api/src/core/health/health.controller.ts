import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { SkipThrottle } from '@nestjs/throttler';
import { Public } from '../../common/decorators/auth.decorators';
import { PrismaHealthIndicator } from './prisma.health';

/**
 * Probes (§6.3). Mounted outside the versioned prefix so orchestrators keep
 * probing them across API versions.
 *
 * Exempt from the global throttle: a probe firing on a fixed interval must not
 * be able to spend the per-IP budget, and behind a load balancer every probe
 * arrives from the same address.
 *
 * The split matters. `/health` answers "is this process alive" and touches
 * nothing, so a database blip can never make an orchestrator kill a healthy
 * container. `/health/ready` answers "can this process serve traffic" and does
 * hit the database, which is the signal a load balancer should depool on.
 */
@ApiTags('Public')
@SkipThrottle()
@Controller('health')
export class HealthController {
  private readonly startedAt = Date.now();

  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaHealthIndicator,
  ) {}

  /**
   * Liveness.
   *
   * This deliberately runs no memory check. Terminus' `checkHeap`/`checkRSS`
   * used to gate this route at 512 MB / 1 GB, which meant an ordinary heap
   * spike answered the probe with 503 — and since the Dockerfile HEALTHCHECK
   * polls this path, a busy container would be declared unhealthy and
   * restarted, freeing the memory and repeating. Memory pressure is a
   * monitoring signal, not a reason to shoot the process.
   */
  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe — the process is up and serving' })
  live(): { status: 'ok'; uptimeSeconds: number } {
    return { status: 'ok', uptimeSeconds: Math.floor((Date.now() - this.startedAt) / 1000) };
  }

  /** Readiness: a real database round-trip, so a depooled instance is one that genuinely cannot serve. */
  @Public()
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe — dependencies are reachable' })
  ready(): Promise<HealthCheckResult> {
    return this.health.check([() => this.prisma.pingCheck('database')]);
  }
}

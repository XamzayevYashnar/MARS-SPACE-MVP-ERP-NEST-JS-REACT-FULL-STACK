import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import { AppConfig } from '../../../core/config/app.config';
import { RefreshTokenRepository } from '../domain/repositories/refresh-token.repository';

/**
 * Reaps refresh tokens that can never be used again.
 *
 * Rotation writes a new row on every refresh and revokes the old one, so an
 * active admin produces dozens of dead rows a day. Nothing ever deleted them,
 * which left `refresh_tokens` growing without bound and slowed the unique
 * lookup on `tokenHash` that sits in the hot path of every refresh.
 *
 * Rows are only removed once they are past the refresh TTL, so a revoked row
 * still lingers long enough for the reuse detection in `RefreshTokenUseCase`
 * to recognise a replayed token rather than silently treating it as unknown.
 */
@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);
  private readonly isTest: boolean;

  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    configService: ConfigService,
  ) {
    this.isTest = configService.getOrThrow<AppConfig>('app').isTest;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM, { name: 'refresh-token-cleanup' })
  async purgeExpired(): Promise<void> {
    // The e2e suite drives the clock itself; a background write mid-test would
    // race with its assertions.
    if (this.isTest) {
      return;
    }

    try {
      const removed = await this.refreshTokenRepository.deleteExpired(new Date());
      if (removed > 0) {
        this.logger.log(`Purged ${removed} expired or revoked refresh token(s)`);
      }
    } catch (error) {
      // Housekeeping must never take the process down.
      this.logger.error(
        `Refresh-token cleanup failed: ${error instanceof Error ? error.message : 'unknown error'}`,
      );
    }
  }
}

import { Injectable } from '@nestjs/common';
import { TokenService } from '../../../../core/security/token.service';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Revokes the session the caller is logged in with.
   *
   * Logout is idempotent: an unknown or already-revoked token still resolves,
   * because reporting "that session does not exist" would only tell an attacker
   * which tokens are live, and the caller's intent is satisfied either way.
   */
  async execute(presentedToken: string | undefined, userId: string): Promise<void> {
    if (!presentedToken) {
      return;
    }

    const stored = await this.refreshTokenRepository.findByHash(
      this.tokenService.hashRefreshToken(presentedToken),
    );

    // Only ever revoke a session that belongs to the authenticated caller.
    if (stored && stored.userId === userId && !stored.isRevoked()) {
      await this.refreshTokenRepository.revoke(stored.id);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { TokenService } from '../../../../core/security/token.service';
import {
  AccountDeactivatedError,
  UserNotFoundError,
} from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { InvalidRefreshTokenError } from '../../domain/errors/auth.errors';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { AuthTokensDto } from '../dto/auth.dto';
import { RequestContext } from './login.use-case';

@Injectable()
export class RefreshTokenUseCase {
  private readonly logger = new Logger(RefreshTokenUseCase.name);

  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Rotates the session: the presented token is revoked and a fresh pair is
   * issued (§7). Rotation is what makes a stolen refresh token single-use — a
   * replay finds the row already revoked.
   *
   * Finding an *already revoked* row is more than a stale request: that token
   * was rotated once and is being presented a second time, which means two
   * parties hold it. Since we cannot tell the thief from the victim, the whole
   * family is torn down and both are forced to log in again.
   */
  async execute(presentedToken: string, context: RequestContext = {}): Promise<AuthTokensDto> {
    const tokenHash = this.tokenService.hashRefreshToken(presentedToken);
    const stored = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!stored) {
      throw new InvalidRefreshTokenError();
    }

    if (stored.isRevoked()) {
      const revoked = await this.refreshTokenRepository.revokeAllForUser(stored.userId);
      this.logger.warn(
        `Refresh token reuse detected for user ${stored.userId} — revoked ${revoked} live session(s)`,
      );
      throw new InvalidRefreshTokenError();
    }

    if (stored.isExpired()) {
      throw new InvalidRefreshTokenError();
    }

    const user = await this.userRepository.findById(stored.userId);
    if (!user) {
      await this.refreshTokenRepository.revoke(stored.id);
      throw new UserNotFoundError(stored.userId);
    }

    if (!user.canAuthenticate()) {
      await this.refreshTokenRepository.revokeAllForUser(user.id);
      throw new AccountDeactivatedError();
    }

    await this.refreshTokenRepository.revoke(stored.id);

    const accessToken = await this.tokenService.issueAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refresh = this.tokenService.createRefreshToken();
    await this.refreshTokenRepository.create({
      tokenHash: refresh.tokenHash,
      userId: user.id,
      userAgent: context.userAgent ?? stored.userAgent,
      ipAddress: context.ipAddress ?? stored.ipAddress,
      expiresAt: refresh.expiresAt,
    });

    return {
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.tokenService.accessTtlSeconds(),
      tokenType: 'Bearer',
    };
  }
}

import { Injectable } from '@nestjs/common';
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
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Rotates the session: the presented token is revoked and a fresh pair is
   * issued (§7). Rotation is what makes a stolen refresh token single-use — a
   * replay finds the row already revoked.
   */
  async execute(presentedToken: string, context: RequestContext = {}): Promise<AuthTokensDto> {
    const tokenHash = this.tokenService.hashRefreshToken(presentedToken);
    const stored = await this.refreshTokenRepository.findByHash(tokenHash);

    if (!stored || !stored.isUsable()) {
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

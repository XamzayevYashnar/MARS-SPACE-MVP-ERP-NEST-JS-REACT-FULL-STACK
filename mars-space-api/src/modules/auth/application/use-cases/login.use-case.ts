import { Injectable } from '@nestjs/common';
import { HashingService } from '../../../../core/security/hashing.service';
import { TokenService } from '../../../../core/security/token.service';
import {
  AccountDeactivatedError,
  InvalidCredentialsError,
} from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { UserMapper } from '../../../users/application/mappers/user.mapper';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { LoginDto, LoginResponseDto } from '../dto/auth.dto';

export interface RequestContext {
  userAgent?: string | null;
  ipAddress?: string | null;
}

@Injectable()
export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
  ) {}

  async execute(dto: LoginDto, context: RequestContext = {}): Promise<LoginResponseDto> {
    const user = await this.userRepository.findByEmail(dto.email);

    // The password is verified even when the account is missing, so response
    // timing does not reveal which emails are registered.
    const passwordMatches = user
      ? await this.hashingService.verify(user.passwordHash, dto.password)
      : await this.hashingService.verify(DUMMY_HASH, dto.password);

    if (!user || !passwordMatches) {
      throw new InvalidCredentialsError();
    }

    if (!user.canAuthenticate()) {
      throw new AccountDeactivatedError();
    }

    const accessToken = await this.tokenService.issueAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    const refresh = this.tokenService.createRefreshToken();
    await this.refreshTokenRepository.create({
      tokenHash: refresh.tokenHash,
      userId: user.id,
      userAgent: context.userAgent ?? null,
      ipAddress: context.ipAddress ?? null,
      expiresAt: refresh.expiresAt,
    });

    await this.userRepository.touchLastLogin(user.id, new Date());

    return {
      accessToken,
      refreshToken: refresh.token,
      expiresIn: this.tokenService.accessTtlSeconds(),
      tokenType: 'Bearer',
      user: UserMapper.toResponse(user),
    };
  }
}

/**
 * A syntactically valid argon2id hash of a value nobody knows.
 * Verifying against it keeps the "unknown email" path as expensive as the
 * "wrong password" path.
 */
const DUMMY_HASH =
  '$argon2id$v=19$m=19456,t=2,p=1$c29tZS1yYW5kb20tc2FsdA$8Q2wJ1vHkKQqDLnJ7HzVQ0k5xW3xR2t4Y7uZ9pL0aA8';

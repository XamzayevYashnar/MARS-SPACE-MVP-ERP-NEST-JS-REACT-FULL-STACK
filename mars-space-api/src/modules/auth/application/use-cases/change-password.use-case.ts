import { Injectable } from '@nestjs/common';
import { BusinessRuleException } from '../../../../common/exceptions';
import { HashingService } from '../../../../core/security/hashing.service';
import { TokenService } from '../../../../core/security/token.service';
import { UserNotFoundError } from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { IncorrectCurrentPasswordError } from '../../domain/errors/auth.errors';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';
import { ChangePasswordDto } from '../dto/auth.dto';

@Injectable()
export class ChangePasswordUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly hashingService: HashingService,
    private readonly tokenService: TokenService,
  ) {}

  /**
   * Changing a password revokes every *other* session (§6.3), which is what
   * turns a password change into an effective response to a suspected leak.
   * The current session survives so the user is not logged out of the tab they
   * just used.
   */
  async execute(
    userId: string,
    dto: ChangePasswordDto,
    currentRefreshToken?: string,
  ): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    if (!(await this.hashingService.verify(user.passwordHash, dto.currentPassword))) {
      throw new IncorrectCurrentPasswordError();
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BusinessRuleException('The new password must differ from the current one');
    }

    await this.userRepository.update(userId, {
      passwordHash: await this.hashingService.hash(dto.newPassword),
    });

    const currentSession = currentRefreshToken
      ? await this.refreshTokenRepository.findByHash(
          this.tokenService.hashRefreshToken(currentRefreshToken),
        )
      : null;

    if (currentSession && currentSession.userId === userId) {
      await this.refreshTokenRepository.revokeAllForUserExcept(userId, currentSession.id);
    } else {
      await this.refreshTokenRepository.revokeAllForUser(userId);
    }
  }
}

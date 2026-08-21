import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RefreshTokenRepository } from '../../../auth/domain/repositories/refresh-token.repository';
import { LastSuperAdminError, UserNotFoundError } from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UpdateUserStatusUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(id: string, isActive: boolean): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    if (
      !isActive &&
      existing.role === UserRole.SUPER_ADMIN &&
      (await this.userRepository.countByRole(UserRole.SUPER_ADMIN)) <= 1
    ) {
      throw new LastSuperAdminError('deactivate');
    }

    const user = await this.userRepository.update(id, { isActive });

    // Deactivation has to end live sessions, otherwise the account keeps
    // working until its refresh token ages out.
    if (!isActive) {
      await this.refreshTokenRepository.revokeAllForUser(id);
    }

    return UserMapper.toResponse(user);
  }
}

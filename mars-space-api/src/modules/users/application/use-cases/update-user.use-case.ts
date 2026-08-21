import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { RefreshTokenRepository } from '../../../auth/domain/repositories/refresh-token.repository';
import {
  LastSuperAdminError,
  UserEmailTakenError,
  UserNotFoundError,
} from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserDto, UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
  ) {}

  async execute(id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    const email = dto.email?.trim().toLowerCase();
    if (email && email !== existing.email && (await this.userRepository.existsByEmail(email, id))) {
      throw new UserEmailTakenError(email);
    }

    // The system must always keep at least one account that can manage accounts.
    const demotesLastOwner =
      existing.role === UserRole.SUPER_ADMIN &&
      dto.role !== undefined &&
      dto.role !== UserRole.SUPER_ADMIN;
    if (demotesLastOwner && (await this.userRepository.countByRole(UserRole.SUPER_ADMIN)) <= 1) {
      throw new LastSuperAdminError('demote');
    }

    const user = await this.userRepository.update(id, {
      fullName: dto.fullName?.trim(),
      email,
      phone: dto.phone,
      role: dto.role,
      avatarUrl: dto.avatarUrl,
      isActive: dto.isActive,
    });

    // A demotion or a deactivation must take effect immediately, not once the
    // current access token happens to expire.
    if (dto.role !== undefined || dto.isActive === false) {
      await this.refreshTokenRepository.revokeAllForUser(id);
    }

    return UserMapper.toResponse(user);
  }
}

import { Injectable } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BusinessRuleException } from '../../../../common/exceptions';
import { LastSuperAdminError, UserNotFoundError } from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class DeleteUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * `currentUserId` is passed in so the caller cannot delete the account they
   * are authenticated with — a mistake that would lock them out mid-session.
   */
  async execute(id: string, currentUserId: string): Promise<void> {
    const existing = await this.userRepository.findById(id);
    if (!existing) {
      throw new UserNotFoundError(id);
    }

    if (id === currentUserId) {
      throw new BusinessRuleException('You cannot delete your own account');
    }

    if (
      existing.role === UserRole.SUPER_ADMIN &&
      (await this.userRepository.countByRole(UserRole.SUPER_ADMIN)) <= 1
    ) {
      throw new LastSuperAdminError('delete');
    }

    await this.userRepository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { UserResponseDto } from '../../../users/application/dto/user.dto';
import { UserMapper } from '../../../users/application/mappers/user.mapper';
import { UserNotFoundError } from '../../../users/domain/errors/user.errors';
import { UserRepository } from '../../../users/domain/repositories/user.repository';

@Injectable()
export class GetProfileUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  /**
   * Reads the profile fresh rather than echoing the token claims, so a role
   * change made by a super admin is visible without waiting for a refresh.
   */
  async execute(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new UserNotFoundError(userId);
    }

    return UserMapper.toResponse(user);
  }
}

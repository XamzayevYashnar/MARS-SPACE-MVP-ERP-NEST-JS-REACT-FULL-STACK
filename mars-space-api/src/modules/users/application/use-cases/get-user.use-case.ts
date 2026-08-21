import { Injectable } from '@nestjs/common';
import { UserNotFoundError } from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class GetUserUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(id: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new UserNotFoundError(id);
    }

    return UserMapper.toResponse(user);
  }
}

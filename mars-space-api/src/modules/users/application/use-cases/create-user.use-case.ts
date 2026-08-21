import { Injectable } from '@nestjs/common';
import { HashingService } from '../../../../core/security/hashing.service';
import { UserEmailTakenError } from '../../domain/errors/user.errors';
import { UserRepository } from '../../domain/repositories/user.repository';
import { CreateUserDto, UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashingService: HashingService,
  ) {}

  async execute(dto: CreateUserDto): Promise<UserResponseDto> {
    const email = dto.email.trim().toLowerCase();

    // Checked explicitly so the client gets ALREADY_EXISTS with the offending
    // field, instead of a bare unique-constraint translation.
    if (await this.userRepository.existsByEmail(email)) {
      throw new UserEmailTakenError(email);
    }

    const user = await this.userRepository.create({
      fullName: dto.fullName.trim(),
      email,
      phone: dto.phone ?? null,
      passwordHash: await this.hashingService.hash(dto.password),
      role: dto.role,
      avatarUrl: dto.avatarUrl ?? null,
      isActive: dto.isActive ?? true,
    });

    return UserMapper.toResponse(user);
  }
}

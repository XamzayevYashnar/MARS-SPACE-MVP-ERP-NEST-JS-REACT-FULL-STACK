import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { UserRepository } from '../../domain/repositories/user.repository';
import { QueryUsersDto, UserResponseDto } from '../dto/user.dto';
import { UserMapper } from '../mappers/user.mapper';

@Injectable()
export class ListUsersUseCase {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(dto: QueryUsersDto): Promise<Paginated<UserResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.userRepository.findMany({
      ...params,
      role: dto.role,
      isActive: dto.isActive,
    });

    return { items: UserMapper.toResponseList(items), meta };
  }
}

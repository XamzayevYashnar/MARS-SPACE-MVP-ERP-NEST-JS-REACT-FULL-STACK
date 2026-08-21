import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { GroupResponseDto } from '../dto/group.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class GetGroupUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(id: string): Promise<GroupResponseDto> {
    const group = await this.groupRepository.findById(id);
    if (!group) {
      throw new EntityNotFoundException('Group', id);
    }

    return GroupMapper.toResponse(group);
  }
}

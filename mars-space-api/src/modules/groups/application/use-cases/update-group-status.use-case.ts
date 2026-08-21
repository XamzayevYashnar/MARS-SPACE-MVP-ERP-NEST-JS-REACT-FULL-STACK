import { Injectable } from '@nestjs/common';
import { GroupStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { GroupResponseDto } from '../dto/group.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class UpdateGroupStatusUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(id: string, status: GroupStatus): Promise<GroupResponseDto> {
    const existing = await this.groupRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Group', id);
    }

    // A finished intake is a historical record; reopening it would put a past
    // group back on the public "upcoming" list.
    if (existing.status === GroupStatus.FINISHED && status !== GroupStatus.FINISHED) {
      throw new BusinessRuleException('A finished group cannot be reopened');
    }

    const group = await this.groupRepository.update(id, { status });
    return GroupMapper.toResponse(group);
  }
}

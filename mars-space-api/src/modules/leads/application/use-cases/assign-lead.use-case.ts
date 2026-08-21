import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { UserRepository } from '../../../users/domain/repositories/user.repository';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadResponseDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class AssignLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly userRepository: UserRepository,
  ) {}

  /** `assignedToId: null` unassigns the lead and returns it to the queue. */
  async execute(id: string, assignedToId: string | null): Promise<LeadResponseDto> {
    if (!(await this.leadRepository.findById(id))) {
      throw new EntityNotFoundException('Lead', id);
    }

    if (assignedToId) {
      const assignee = await this.userRepository.findById(assignedToId);
      // A deactivated account must not be handed new work.
      if (!assignee || !assignee.isActive) {
        throw new EntityNotFoundException('Active user', assignedToId);
      }
    }

    const lead = await this.leadRepository.update(id, { assignedToId });
    return LeadMapper.toResponse(lead);
  }
}

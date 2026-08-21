import { Injectable } from '@nestjs/common';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import {
  GroupCapacityExceededError,
  GroupClosedForEnrolmentError,
} from '../../../groups/domain/errors/group.errors';
import { GroupRepository } from '../../../groups/domain/repositories/group.repository';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { ConvertLeadDto, LeadConversionResultDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class ConvertLeadUseCase {
  constructor(
    private readonly leadRepository: LeadRepository,
    private readonly groupRepository: GroupRepository,
  ) {}

  /**
   * §6.4.3 — `POST /admin/leads/:id/convert`.
   *
   * Creates the student and flips the lead to ENROLLED inside one transaction,
   * so a failure halfway cannot leave an enrolled lead without a student.
   * Idempotency is by refusal: converting twice is a 409, not a second student.
   */
  async execute(id: string, dto: ConvertLeadDto): Promise<LeadConversionResultDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new EntityNotFoundException('Lead', id);
    }

    if (lead.isConverted()) {
      throw new BusinessRuleException('This lead has already been converted into a student');
    }

    const group = await this.groupRepository.findById(dto.groupId);
    if (!group) {
      throw new EntityNotFoundException('Group', dto.groupId);
    }

    // Checked here for a precise message; the repository re-checks inside the
    // transaction so a concurrent enrolment cannot slip past.
    if (!group.acceptsEnrolment()) {
      if (group.isFull()) {
        throw new GroupCapacityExceededError(group.name, group.capacity);
      }
      throw new GroupClosedForEnrolmentError(group.name, group.status);
    }

    const { lead: converted, studentId } = await this.leadRepository.convertToStudent({
      leadId: id,
      groupId: dto.groupId,
      note: dto.note ?? null,
    });

    return { lead: LeadMapper.toResponse(converted), studentId };
  }
}

import { Injectable } from '@nestjs/common';
import { LeadStatus } from '@prisma/client';
import { BusinessRuleException, EntityNotFoundException } from '../../../../common/exceptions';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadResponseDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class UpdateLeadStatusUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(id: string, status: LeadStatus): Promise<LeadResponseDto> {
    const existing = await this.leadRepository.findById(id);
    if (!existing) {
      throw new EntityNotFoundException('Lead', id);
    }

    // ENROLLED is set by the conversion endpoint, which also creates the
    // student; setting it by hand would leave the two records out of step.
    if (status === LeadStatus.ENROLLED && !existing.isConverted()) {
      throw new BusinessRuleException(
        'Use POST /admin/leads/:id/convert to enrol a lead — it creates the student record too',
      );
    }

    const lead = await this.leadRepository.update(id, {
      status,
      // The first move out of NEW is when a human actually reached out.
      ...(existing.contactedAt === null && status !== LeadStatus.NEW
        ? { contactedAt: new Date() }
        : {}),
    });

    return LeadMapper.toResponse(lead);
  }
}

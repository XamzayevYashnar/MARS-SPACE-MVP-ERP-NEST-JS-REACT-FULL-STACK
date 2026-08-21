import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadResponseDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class GetLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(id: string): Promise<LeadResponseDto> {
    const lead = await this.leadRepository.findById(id);
    if (!lead) {
      throw new EntityNotFoundException('Lead', id);
    }

    return LeadMapper.toResponse(lead);
  }
}

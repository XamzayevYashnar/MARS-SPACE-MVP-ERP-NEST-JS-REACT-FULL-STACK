import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { stripHtml } from '../../../../common/utils/sanitize-html.util';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadResponseDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class UpdateLeadNoteUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(id: string, adminNote: string): Promise<LeadResponseDto> {
    if (!(await this.leadRepository.findById(id))) {
      throw new EntityNotFoundException('Lead', id);
    }

    // The note is rendered in the admin panel, so it stays plain text.
    const lead = await this.leadRepository.update(id, { adminNote: stripHtml(adminNote) });
    return LeadMapper.toResponse(lead);
  }
}

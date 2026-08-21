import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { LeadRepository } from '../../domain/repositories/lead.repository';

@Injectable()
export class DeleteLeadUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  /**
   * Deleting a converted lead leaves its student untouched — the student is the
   * record that matters once someone has enrolled.
   */
  async execute(id: string): Promise<void> {
    if (!(await this.leadRepository.findById(id))) {
      throw new EntityNotFoundException('Lead', id);
    }

    await this.leadRepository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';

@Injectable()
export class DeleteContactMessageUseCase {
  constructor(private readonly repository: ContactMessageRepository) {}

  async execute(id: string): Promise<void> {
    if (!(await this.repository.findById(id))) {
      throw new EntityNotFoundException('Contact message', id);
    }

    await this.repository.delete(id);
  }
}

import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';
import { ContactMessageResponseDto } from '../dto/contact-message.dto';
import { ContactMessageMapper } from '../mappers/contact-message.mapper';

@Injectable()
export class GetContactMessageUseCase {
  constructor(private readonly repository: ContactMessageRepository) {}

  async execute(id: string): Promise<ContactMessageResponseDto> {
    const message = await this.repository.findById(id);
    if (!message) {
      throw new EntityNotFoundException('Contact message', id);
    }

    return ContactMessageMapper.toResponse(message);
  }
}

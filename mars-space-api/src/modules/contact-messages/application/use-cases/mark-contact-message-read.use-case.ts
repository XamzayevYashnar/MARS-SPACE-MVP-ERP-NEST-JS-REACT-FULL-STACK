import { Injectable } from '@nestjs/common';
import { EntityNotFoundException } from '../../../../common/exceptions';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';
import { ContactMessageResponseDto } from '../dto/contact-message.dto';
import { ContactMessageMapper } from '../mappers/contact-message.mapper';

@Injectable()
export class MarkContactMessageReadUseCase {
  constructor(private readonly repository: ContactMessageRepository) {}

  async execute(id: string, isRead: boolean): Promise<ContactMessageResponseDto> {
    if (!(await this.repository.findById(id))) {
      throw new EntityNotFoundException('Contact message', id);
    }

    return ContactMessageMapper.toResponse(await this.repository.markAsRead(id, isRead));
  }
}

import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';
import { ContactMessageResponseDto, QueryContactMessagesDto } from '../dto/contact-message.dto';
import { ContactMessageMapper } from '../mappers/contact-message.mapper';

@Injectable()
export class ListContactMessagesUseCase {
  constructor(private readonly repository: ContactMessageRepository) {}

  async execute(dto: QueryContactMessagesDto): Promise<Paginated<ContactMessageResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.repository.findMany({ ...params, isRead: dto.isRead });

    return { items: ContactMessageMapper.toResponseList(items), meta };
  }
}

import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { LeadRepository } from '../../domain/repositories/lead.repository';
import { LeadResponseDto, QueryLeadsDto } from '../dto/lead.dto';
import { LeadMapper } from '../mappers/lead.mapper';

@Injectable()
export class ListLeadsUseCase {
  constructor(private readonly leadRepository: LeadRepository) {}

  async execute(dto: QueryLeadsDto): Promise<Paginated<LeadResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.leadRepository.findMany({
      ...params,
      status: dto.status,
      source: dto.source,
      courseId: dto.courseId,
      assignedToId: dto.assignedToId,
      dateFrom: dto.dateFrom ? new Date(dto.dateFrom) : undefined,
      // `dateTo` names a day, so the range has to include that whole day.
      dateTo: dto.dateTo ? endOfDay(new Date(dto.dateTo)) : undefined,
    });

    return { items: LeadMapper.toResponseList(items), meta };
  }
}

function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

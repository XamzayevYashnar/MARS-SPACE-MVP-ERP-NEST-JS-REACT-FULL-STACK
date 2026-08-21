import { Injectable } from '@nestjs/common';
import { Paginated } from '../../../../common/interfaces';
import { buildPaginationParams } from '../../../../common/utils/pagination.util';
import { GroupRepository } from '../../domain/repositories/group.repository';
import { GroupResponseDto, QueryGroupsDto, QueryUpcomingGroupsDto } from '../dto/group.dto';
import { GroupMapper } from '../mappers/group.mapper';

@Injectable()
export class ListGroupsUseCase {
  constructor(private readonly groupRepository: GroupRepository) {}

  async execute(dto: QueryGroupsDto): Promise<Paginated<GroupResponseDto>> {
    const params = buildPaginationParams(dto);

    const { items, meta } = await this.groupRepository.findMany({
      ...params,
      courseId: dto.courseId,
      teacherId: dto.teacherId,
      status: dto.status,
    });

    return { items: GroupMapper.toResponseList(items), meta };
  }

  /**
   * `GET /groups/upcoming` — intakes still forming that start today or later,
   * sorted by start date so the soonest one leads (§6.3).
   */
  async executeUpcoming(dto: QueryUpcomingGroupsDto): Promise<Paginated<GroupResponseDto>> {
    const params = buildPaginationParams({ ...dto, sortBy: 'startDate', sortOrder: 'asc' });

    const { items, meta } = await this.groupRepository.findMany({
      ...params,
      courseId: dto.courseId,
      upcomingOnly: true,
    });

    return { items: GroupMapper.toResponseList(items, dto.lang), meta };
  }
}

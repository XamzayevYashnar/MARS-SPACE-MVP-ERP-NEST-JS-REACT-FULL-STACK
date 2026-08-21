import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { Paginated } from '../../../common/interfaces';
import { GroupResponseDto, QueryUpcomingGroupsDto } from '../application/dto/group.dto';
import { ListGroupsUseCase } from '../application/use-cases/list-groups.use-case';

@ApiTags('Public')
@Public()
@Controller('groups')
export class GroupsController {
  constructor(private readonly listGroups: ListGroupsUseCase) {}

  @Get('upcoming')
  @ApiOperation({
    summary: 'Intakes still forming that start today or later, including freeSeats',
  })
  @ApiOkPaginated(GroupResponseDto)
  upcoming(@Query() query: QueryUpcomingGroupsDto): Promise<Paginated<GroupResponseDto>> {
    return this.listGroups.executeUpcoming(query);
  }
}

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Roles } from '../../../common/decorators/auth.decorators';
import { IdParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import {
  CreateGroupDto,
  GroupResponseDto,
  QueryGroupsDto,
  UpdateGroupDto,
  UpdateGroupStatusDto,
} from '../application/dto/group.dto';
import { CreateGroupUseCase } from '../application/use-cases/create-group.use-case';
import { DeleteGroupUseCase } from '../application/use-cases/delete-group.use-case';
import { GetGroupUseCase } from '../application/use-cases/get-group.use-case';
import { ListGroupsUseCase } from '../application/use-cases/list-groups.use-case';
import { UpdateGroupStatusUseCase } from '../application/use-cases/update-group-status.use-case';
import { UpdateGroupUseCase } from '../application/use-cases/update-group.use-case';

@ApiTags('Admin: Groups')
@ApiBearerAuth('access-token')
@Roles(UserRole.MANAGER)
@Controller('admin/groups')
export class GroupsAdminController {
  constructor(
    private readonly listGroups: ListGroupsUseCase,
    private readonly getGroup: GetGroupUseCase,
    private readonly createGroup: CreateGroupUseCase,
    private readonly updateGroup: UpdateGroupUseCase,
    private readonly updateGroupStatus: UpdateGroupStatusUseCase,
    private readonly deleteGroup: DeleteGroupUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List groups; filter by courseId, teacherId or status' })
  @ApiOkPaginated(GroupResponseDto)
  list(@Query() query: QueryGroupsDto): Promise<Paginated<GroupResponseDto>> {
    return this.listGroups.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a group' })
  @ApiOkEnvelope(GroupResponseDto)
  create(@Body() dto: CreateGroupDto): Promise<GroupResponseDto> {
    return this.createGroup.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one group' })
  @ApiOkEnvelope(GroupResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<GroupResponseDto> {
    return this.getGroup.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a group' })
  @ApiOkEnvelope(GroupResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateGroupDto): Promise<GroupResponseDto> {
    return this.updateGroup.execute(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Change the group status' })
  @ApiOkEnvelope(GroupResponseDto)
  setStatus(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateGroupStatusDto,
  ): Promise<GroupResponseDto> {
    return this.updateGroupStatus.execute(id, dto.status);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a group that holds no students' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteGroup.execute(id);
  }
}

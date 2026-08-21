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
import { UserRole } from '@prisma/client';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { CurrentUser, Roles } from '../../../common/decorators/auth.decorators';
import { IdParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import {
  CreateUserDto,
  QueryUsersDto,
  UpdateUserDto,
  UpdateUserStatusDto,
  UserResponseDto,
} from '../application/dto/user.dto';
import { CreateUserUseCase } from '../application/use-cases/create-user.use-case';
import { DeleteUserUseCase } from '../application/use-cases/delete-user.use-case';
import { GetUserUseCase } from '../application/use-cases/get-user.use-case';
import { ListUsersUseCase } from '../application/use-cases/list-users.use-case';
import { UpdateUserStatusUseCase } from '../application/use-cases/update-user-status.use-case';
import { UpdateUserUseCase } from '../application/use-cases/update-user.use-case';

/**
 * Staff account management (§6.3) — SUPER_ADMIN only.
 *
 * Every handler validates, delegates to one use case and returns its result;
 * no business logic lives here (§0 rule 4).
 */
@ApiTags('Admin: Users')
@ApiBearerAuth('access-token')
@Roles(UserRole.SUPER_ADMIN)
@Controller('admin/users')
export class UsersAdminController {
  constructor(
    private readonly listUsers: ListUsersUseCase,
    private readonly getUser: GetUserUseCase,
    private readonly createUser: CreateUserUseCase,
    private readonly updateUser: UpdateUserUseCase,
    private readonly updateUserStatus: UpdateUserStatusUseCase,
    private readonly deleteUser: DeleteUserUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List staff accounts' })
  @ApiOkPaginated(UserResponseDto)
  list(@Query() query: QueryUsersDto): Promise<Paginated<UserResponseDto>> {
    return this.listUsers.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one staff account' })
  @ApiOkEnvelope(UserResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<UserResponseDto> {
    return this.getUser.execute(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a staff account' })
  @ApiOkEnvelope(UserResponseDto)
  create(@Body() dto: CreateUserDto): Promise<UserResponseDto> {
    return this.createUser.execute(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a staff account' })
  @ApiOkEnvelope(UserResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateUserDto): Promise<UserResponseDto> {
    return this.updateUser.execute(id, dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate an account' })
  @ApiOkEnvelope(UserResponseDto)
  setStatus(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateUserStatusDto,
  ): Promise<UserResponseDto> {
    return this.updateUserStatus.execute(id, dto.isActive);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a staff account' })
  remove(@Param() { id }: IdParamDto, @CurrentUser('id') currentUserId: string): Promise<void> {
    return this.deleteUser.execute(id, currentUserId);
  }
}

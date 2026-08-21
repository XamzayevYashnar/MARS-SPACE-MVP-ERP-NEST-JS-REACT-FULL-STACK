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
import { ReorderDto } from '../../../common/dto/reorder.dto';
import { Paginated } from '../../../common/interfaces';
import {
  CreateTeacherDto,
  QueryTeachersDto,
  TeacherResponseDto,
  UpdateTeacherDto,
} from '../application/dto/teacher.dto';
import { CreateTeacherUseCase } from '../application/use-cases/create-teacher.use-case';
import { DeleteTeacherUseCase } from '../application/use-cases/delete-teacher.use-case';
import { GetTeacherUseCase } from '../application/use-cases/get-teacher.use-case';
import { ListTeachersUseCase } from '../application/use-cases/list-teachers.use-case';
import { ReorderTeachersUseCase } from '../application/use-cases/reorder-teachers.use-case';
import { UpdateTeacherUseCase } from '../application/use-cases/update-teacher.use-case';

@ApiTags('Admin: Teachers')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/teachers')
export class TeachersAdminController {
  constructor(
    private readonly listTeachers: ListTeachersUseCase,
    private readonly getTeacher: GetTeacherUseCase,
    private readonly createTeacher: CreateTeacherUseCase,
    private readonly updateTeacher: UpdateTeacherUseCase,
    private readonly deleteTeacher: DeleteTeacherUseCase,
    private readonly reorderTeachers: ReorderTeachersUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every teacher' })
  @ApiOkPaginated(TeacherResponseDto)
  list(@Query() query: QueryTeachersDto): Promise<Paginated<TeacherResponseDto>> {
    return this.listTeachers.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a teacher' })
  @ApiOkEnvelope(TeacherResponseDto)
  create(@Body() dto: CreateTeacherDto): Promise<TeacherResponseDto> {
    return this.createTeacher.execute(dto);
  }

  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apply a new ordering to the teacher list' })
  reorder(@Body() dto: ReorderDto): Promise<void> {
    return this.reorderTeachers.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one teacher' })
  @ApiOkEnvelope(TeacherResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<TeacherResponseDto> {
    return this.getTeacher.byId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a teacher' })
  @ApiOkEnvelope(TeacherResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateTeacherDto): Promise<TeacherResponseDto> {
    return this.updateTeacher.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a teacher who leads no groups' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteTeacher.execute(id);
  }
}

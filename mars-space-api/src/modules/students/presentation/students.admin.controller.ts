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
  CreateStudentDto,
  MoveStudentDto,
  QueryStudentsDto,
  StudentResponseDto,
  UpdateStudentDto,
} from '../application/dto/student.dto';
import { CreateStudentUseCase } from '../application/use-cases/create-student.use-case';
import { DeleteStudentUseCase } from '../application/use-cases/delete-student.use-case';
import { GetStudentUseCase } from '../application/use-cases/get-student.use-case';
import { ListStudentsUseCase } from '../application/use-cases/list-students.use-case';
import { MoveStudentUseCase } from '../application/use-cases/move-student.use-case';
import { UpdateStudentUseCase } from '../application/use-cases/update-student.use-case';

@ApiTags('Admin: Students')
@ApiBearerAuth('access-token')
@Roles(UserRole.MANAGER)
@Controller('admin/students')
export class StudentsAdminController {
  constructor(
    private readonly listStudents: ListStudentsUseCase,
    private readonly getStudent: GetStudentUseCase,
    private readonly createStudent: CreateStudentUseCase,
    private readonly updateStudent: UpdateStudentUseCase,
    private readonly moveStudent: MoveStudentUseCase,
    private readonly deleteStudent: DeleteStudentUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List students; filter by groupId, courseId or status' })
  @ApiOkPaginated(StudentResponseDto)
  list(@Query() query: QueryStudentsDto): Promise<Paginated<StudentResponseDto>> {
    return this.listStudents.execute(query);
  }

  @Post()
  @ApiOperation({
    summary: 'Enrol a student',
    description: 'Returns 409 GROUP_CAPACITY_EXCEEDED when the target group is full.',
  })
  @ApiOkEnvelope(StudentResponseDto)
  create(@Body() dto: CreateStudentDto): Promise<StudentResponseDto> {
    return this.createStudent.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one student' })
  @ApiOkEnvelope(StudentResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<StudentResponseDto> {
    return this.getStudent.execute(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a student' })
  @ApiOkEnvelope(StudentResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateStudentDto): Promise<StudentResponseDto> {
    return this.updateStudent.execute(id, dto);
  }

  @Patch(':id/move')
  @ApiOperation({ summary: 'Move a student to another group' })
  @ApiOkEnvelope(StudentResponseDto)
  move(@Param() { id }: IdParamDto, @Body() dto: MoveStudentDto): Promise<StudentResponseDto> {
    return this.moveStudent.execute(id, dto.groupId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a student' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteStudent.execute(id);
  }
}

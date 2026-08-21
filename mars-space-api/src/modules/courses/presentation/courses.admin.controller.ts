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
  CourseResponseDto,
  CreateCourseDto,
  FeatureCourseDto,
  PublishCourseDto,
  QueryCoursesDto,
  UpdateCourseDto,
} from '../application/dto/course.dto';
import { CreateCourseUseCase } from '../application/use-cases/create-course.use-case';
import { DeleteCourseUseCase } from '../application/use-cases/delete-course.use-case';
import { FeatureCourseUseCase } from '../application/use-cases/feature-course.use-case';
import { GetCourseUseCase } from '../application/use-cases/get-course.use-case';
import { ListCoursesUseCase } from '../application/use-cases/list-courses.use-case';
import { PublishCourseUseCase } from '../application/use-cases/publish-course.use-case';
import { UpdateCourseUseCase } from '../application/use-cases/update-course.use-case';

@ApiTags('Admin: Courses')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/courses')
export class CoursesAdminController {
  constructor(
    private readonly listCourses: ListCoursesUseCase,
    private readonly getCourse: GetCourseUseCase,
    private readonly createCourse: CreateCourseUseCase,
    private readonly updateCourse: UpdateCourseUseCase,
    private readonly deleteCourse: DeleteCourseUseCase,
    private readonly publishCourse: PublishCourseUseCase,
    private readonly featureCourse: FeatureCourseUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every course, drafts included' })
  @ApiOkPaginated(CourseResponseDto)
  list(@Query() query: QueryCoursesDto): Promise<Paginated<CourseResponseDto>> {
    return this.listCourses.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a course' })
  @ApiOkEnvelope(CourseResponseDto)
  create(@Body() dto: CreateCourseDto): Promise<CourseResponseDto> {
    return this.createCourse.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one course' })
  @ApiOkEnvelope(CourseResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<CourseResponseDto> {
    return this.getCourse.byId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a course' })
  @ApiOkEnvelope(CourseResponseDto)
  update(@Param() { id }: IdParamDto, @Body() dto: UpdateCourseDto): Promise<CourseResponseDto> {
    return this.updateCourse.execute(id, dto);
  }

  @Patch(':id/publish')
  @ApiOperation({ summary: 'Publish or unpublish a course' })
  @ApiOkEnvelope(CourseResponseDto)
  publish(@Param() { id }: IdParamDto, @Body() dto: PublishCourseDto): Promise<CourseResponseDto> {
    return this.publishCourse.execute(id, dto.isPublished);
  }

  @Patch(':id/feature')
  @ApiOperation({ summary: 'Add or remove a course from the home-page carousel' })
  @ApiOkEnvelope(CourseResponseDto)
  feature(@Param() { id }: IdParamDto, @Body() dto: FeatureCourseDto): Promise<CourseResponseDto> {
    return this.featureCourse.execute(id, dto.isFeatured);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course that has no groups' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteCourse.execute(id);
  }
}

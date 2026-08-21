import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { LanguageQueryDto, SlugParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import { CourseResponseDto, QueryPublicCoursesDto } from '../application/dto/course.dto';
import { GetCourseUseCase } from '../application/use-cases/get-course.use-case';
import { ListCoursesUseCase } from '../application/use-cases/list-courses.use-case';

@ApiTags('Public')
@Public()
@Controller('courses')
export class CoursesController {
  constructor(
    private readonly listCourses: ListCoursesUseCase,
    private readonly getCourse: GetCourseUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Published courses',
    description: 'Filters: categorySlug, level, format, isFeatured, minPrice, maxPrice, search.',
  })
  @ApiOkPaginated(CourseResponseDto)
  list(@Query() query: QueryPublicCoursesDto): Promise<Paginated<CourseResponseDto>> {
    return this.listCourses.executePublic(query);
  }

  // Declared before `:slug` so "featured" is not read as a slug.
  @Get('featured')
  @ApiOperation({ summary: 'Up to six featured courses for the home page' })
  @ApiOkEnvelope(CourseResponseDto)
  featured(@Query() { lang }: LanguageQueryDto): Promise<CourseResponseDto[]> {
    return this.listCourses.executeFeatured(lang);
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Course detail',
    description: 'Includes category, teachers, open groups with freeSeats, and published reviews.',
  })
  @ApiOkEnvelope(CourseResponseDto)
  getOne(
    @Param() { slug }: SlugParamDto,
    @Query() { lang }: LanguageQueryDto,
  ): Promise<CourseResponseDto> {
    return this.getCourse.bySlug(slug, lang);
  }
}

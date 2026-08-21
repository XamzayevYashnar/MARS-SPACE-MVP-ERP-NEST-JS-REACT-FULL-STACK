import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { LanguageQueryDto, SlugParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import { QueryPublicTeachersDto, TeacherResponseDto } from '../application/dto/teacher.dto';
import { GetTeacherUseCase } from '../application/use-cases/get-teacher.use-case';
import { ListTeachersUseCase } from '../application/use-cases/list-teachers.use-case';

@ApiTags('Public')
@Public()
@Controller('teachers')
export class TeachersController {
  constructor(
    private readonly listTeachers: ListTeachersUseCase,
    private readonly getTeacher: GetTeacherUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Active teachers ordered by sortOrder' })
  @ApiOkPaginated(TeacherResponseDto)
  list(@Query() query: QueryPublicTeachersDto): Promise<Paginated<TeacherResponseDto>> {
    return this.listTeachers.executePublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Teacher detail with their published courses' })
  @ApiOkEnvelope(TeacherResponseDto)
  getOne(
    @Param() { slug }: SlugParamDto,
    @Query() { lang }: LanguageQueryDto,
  ): Promise<TeacherResponseDto> {
    return this.getTeacher.bySlug(slug, lang);
  }
}

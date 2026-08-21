import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { LanguageQueryDto, SlugParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import { CategoryResponseDto, QueryPublicCategoriesDto } from '../application/dto/category.dto';
import { GetCategoryUseCase } from '../application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';

/** Public category routes of §6.3. */
@ApiTags('Public')
@Public()
@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Active categories ordered by sortOrder, with coursesCount' })
  @ApiOkPaginated(CategoryResponseDto)
  list(@Query() query: QueryPublicCategoriesDto): Promise<Paginated<CategoryResponseDto>> {
    return this.listCategories.executePublic(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'One active category by slug' })
  @ApiOkEnvelope(CategoryResponseDto)
  getOne(
    @Param() { slug }: SlugParamDto,
    @Query() { lang }: LanguageQueryDto,
  ): Promise<CategoryResponseDto> {
    return this.getCategory.bySlug(slug, lang);
  }
}

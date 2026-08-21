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
  CategoryResponseDto,
  CreateCategoryDto,
  QueryCategoriesDto,
  UpdateCategoryDto,
} from '../application/dto/category.dto';
import { CreateCategoryUseCase } from '../application/use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from '../application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from '../application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from '../application/use-cases/list-categories.use-case';
import { ReorderCategoriesUseCase } from '../application/use-cases/reorder-categories.use-case';
import { UpdateCategoryUseCase } from '../application/use-cases/update-category.use-case';

@ApiTags('Admin: Categories')
@ApiBearerAuth('access-token')
@Roles(UserRole.ADMIN)
@Controller('admin/categories')
export class CategoriesAdminController {
  constructor(
    private readonly listCategories: ListCategoriesUseCase,
    private readonly getCategory: GetCategoryUseCase,
    private readonly createCategory: CreateCategoryUseCase,
    private readonly updateCategory: UpdateCategoryUseCase,
    private readonly deleteCategory: DeleteCategoryUseCase,
    private readonly reorderCategories: ReorderCategoriesUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List every category' })
  @ApiOkPaginated(CategoryResponseDto)
  list(@Query() query: QueryCategoriesDto): Promise<Paginated<CategoryResponseDto>> {
    return this.listCategories.execute(query);
  }

  @Post()
  @ApiOperation({ summary: 'Create a category' })
  @ApiOkEnvelope(CategoryResponseDto)
  create(@Body() dto: CreateCategoryDto): Promise<CategoryResponseDto> {
    return this.createCategory.execute(dto);
  }

  // Declared before `:id` so the literal segment is not captured as an id.
  @Patch('reorder')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Apply a new ordering to the category list' })
  reorder(@Body() dto: ReorderDto): Promise<void> {
    return this.reorderCategories.execute(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one category' })
  @ApiOkEnvelope(CategoryResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<CategoryResponseDto> {
    return this.getCategory.byId(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a category' })
  @ApiOkEnvelope(CategoryResponseDto)
  update(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateCategoryDto,
  ): Promise<CategoryResponseDto> {
    return this.updateCategory.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a category that holds no courses' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteCategory.execute(id);
  }
}

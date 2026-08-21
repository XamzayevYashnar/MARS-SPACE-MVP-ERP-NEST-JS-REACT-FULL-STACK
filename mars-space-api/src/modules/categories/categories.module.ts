import { Module } from '@nestjs/common';
import { CreateCategoryUseCase } from './application/use-cases/create-category.use-case';
import { DeleteCategoryUseCase } from './application/use-cases/delete-category.use-case';
import { GetCategoryUseCase } from './application/use-cases/get-category.use-case';
import { ListCategoriesUseCase } from './application/use-cases/list-categories.use-case';
import { ReorderCategoriesUseCase } from './application/use-cases/reorder-categories.use-case';
import { UpdateCategoryUseCase } from './application/use-cases/update-category.use-case';
import { CategoryRepository } from './domain/repositories/category.repository';
import { PrismaCategoryRepository } from './infrastructure/persistence/prisma-category.repository';
import { CategoriesAdminController } from './presentation/categories.admin.controller';
import { CategoriesController } from './presentation/categories.controller';

@Module({
  controllers: [CategoriesController, CategoriesAdminController],
  providers: [
    { provide: CategoryRepository, useClass: PrismaCategoryRepository },
    ListCategoriesUseCase,
    GetCategoryUseCase,
    CreateCategoryUseCase,
    UpdateCategoryUseCase,
    DeleteCategoryUseCase,
    ReorderCategoriesUseCase,
  ],
  exports: [CategoryRepository],
})
export class CategoriesModule {}

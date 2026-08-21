import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module';
import { CreateCourseUseCase } from './application/use-cases/create-course.use-case';
import { DeleteCourseUseCase } from './application/use-cases/delete-course.use-case';
import { FeatureCourseUseCase } from './application/use-cases/feature-course.use-case';
import { GetCourseUseCase } from './application/use-cases/get-course.use-case';
import { ListCoursesUseCase } from './application/use-cases/list-courses.use-case';
import { PublishCourseUseCase } from './application/use-cases/publish-course.use-case';
import { UpdateCourseUseCase } from './application/use-cases/update-course.use-case';
import { CourseRepository } from './domain/repositories/course.repository';
import { PrismaCourseRepository } from './infrastructure/persistence/prisma-course.repository';
import { CoursesAdminController } from './presentation/courses.admin.controller';
import { CoursesController } from './presentation/courses.controller';

/** `CategoriesModule` supplies `CategoryRepository` for the category check. */
@Module({
  imports: [CategoriesModule],
  controllers: [CoursesController, CoursesAdminController],
  providers: [
    { provide: CourseRepository, useClass: PrismaCourseRepository },
    ListCoursesUseCase,
    GetCourseUseCase,
    CreateCourseUseCase,
    UpdateCourseUseCase,
    DeleteCourseUseCase,
    PublishCourseUseCase,
    FeatureCourseUseCase,
  ],
  exports: [CourseRepository],
})
export class CoursesModule {}

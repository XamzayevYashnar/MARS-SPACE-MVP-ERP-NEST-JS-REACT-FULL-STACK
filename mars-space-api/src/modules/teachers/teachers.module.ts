import { Module } from '@nestjs/common';
import { CreateTeacherUseCase } from './application/use-cases/create-teacher.use-case';
import { DeleteTeacherUseCase } from './application/use-cases/delete-teacher.use-case';
import { GetTeacherUseCase } from './application/use-cases/get-teacher.use-case';
import { ListTeachersUseCase } from './application/use-cases/list-teachers.use-case';
import { ReorderTeachersUseCase } from './application/use-cases/reorder-teachers.use-case';
import { UpdateTeacherUseCase } from './application/use-cases/update-teacher.use-case';
import { TeacherRepository } from './domain/repositories/teacher.repository';
import { PrismaTeacherRepository } from './infrastructure/persistence/prisma-teacher.repository';
import { TeachersAdminController } from './presentation/teachers.admin.controller';
import { TeachersController } from './presentation/teachers.controller';

@Module({
  controllers: [TeachersController, TeachersAdminController],
  providers: [
    { provide: TeacherRepository, useClass: PrismaTeacherRepository },
    ListTeachersUseCase,
    GetTeacherUseCase,
    CreateTeacherUseCase,
    UpdateTeacherUseCase,
    DeleteTeacherUseCase,
    ReorderTeachersUseCase,
  ],
  exports: [TeacherRepository],
})
export class TeachersModule {}

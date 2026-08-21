import { Module } from '@nestjs/common';
import { GroupsModule } from '../groups/groups.module';
import { CreateStudentUseCase } from './application/use-cases/create-student.use-case';
import { DeleteStudentUseCase } from './application/use-cases/delete-student.use-case';
import { GetStudentUseCase } from './application/use-cases/get-student.use-case';
import { ListStudentsUseCase } from './application/use-cases/list-students.use-case';
import { MoveStudentUseCase } from './application/use-cases/move-student.use-case';
import { UpdateStudentUseCase } from './application/use-cases/update-student.use-case';
import { StudentRepository } from './domain/repositories/student.repository';
import { PrismaStudentRepository } from './infrastructure/persistence/prisma-student.repository';
import { StudentsAdminController } from './presentation/students.admin.controller';

/** `GroupsModule` supplies `GroupRepository` for the capacity pre-check. */
@Module({
  imports: [GroupsModule],
  controllers: [StudentsAdminController],
  providers: [
    { provide: StudentRepository, useClass: PrismaStudentRepository },
    ListStudentsUseCase,
    GetStudentUseCase,
    CreateStudentUseCase,
    UpdateStudentUseCase,
    MoveStudentUseCase,
    DeleteStudentUseCase,
  ],
  exports: [StudentRepository],
})
export class StudentsModule {}

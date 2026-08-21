import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { TeachersModule } from '../teachers/teachers.module';
import { CreateGroupUseCase } from './application/use-cases/create-group.use-case';
import { DeleteGroupUseCase } from './application/use-cases/delete-group.use-case';
import { GetGroupUseCase } from './application/use-cases/get-group.use-case';
import { ListGroupsUseCase } from './application/use-cases/list-groups.use-case';
import { UpdateGroupStatusUseCase } from './application/use-cases/update-group-status.use-case';
import { UpdateGroupUseCase } from './application/use-cases/update-group.use-case';
import { GroupRepository } from './domain/repositories/group.repository';
import { PrismaGroupRepository } from './infrastructure/persistence/prisma-group.repository';
import { GroupsAdminController } from './presentation/groups.admin.controller';
import { GroupsController } from './presentation/groups.controller';

/** Courses and teachers are imported to validate the two foreign keys. */
@Module({
  imports: [CoursesModule, TeachersModule],
  controllers: [GroupsController, GroupsAdminController],
  providers: [
    { provide: GroupRepository, useClass: PrismaGroupRepository },
    ListGroupsUseCase,
    GetGroupUseCase,
    CreateGroupUseCase,
    UpdateGroupUseCase,
    UpdateGroupStatusUseCase,
    DeleteGroupUseCase,
  ],
  exports: [GroupRepository],
})
export class GroupsModule {}

import { Module } from '@nestjs/common';
import { CoursesModule } from '../courses/courses.module';
import { GroupsModule } from '../groups/groups.module';
import { UsersModule } from '../users/users.module';
import { AssignLeadUseCase } from './application/use-cases/assign-lead.use-case';
import { ConvertLeadUseCase } from './application/use-cases/convert-lead.use-case';
import { CreateLeadUseCase } from './application/use-cases/create-lead.use-case';
import { DeleteLeadUseCase } from './application/use-cases/delete-lead.use-case';
import { GetLeadUseCase } from './application/use-cases/get-lead.use-case';
import { ListLeadsUseCase } from './application/use-cases/list-leads.use-case';
import { UpdateLeadNoteUseCase } from './application/use-cases/update-lead-note.use-case';
import { UpdateLeadStatusUseCase } from './application/use-cases/update-lead-status.use-case';
import { LeadRepository } from './domain/repositories/lead.repository';
import { PrismaLeadRepository } from './infrastructure/persistence/prisma-lead.repository';
import { LeadsAdminController } from './presentation/leads.admin.controller';
import { LeadsController } from './presentation/leads.controller';

/**
 * Courses resolve the course a lead came from, groups back the conversion
 * capacity check, and users validate the assignee. `TelegramNotifier` arrives
 * through the global `CoreModule`.
 */
@Module({
  imports: [CoursesModule, GroupsModule, UsersModule],
  controllers: [LeadsController, LeadsAdminController],
  providers: [
    { provide: LeadRepository, useClass: PrismaLeadRepository },
    CreateLeadUseCase,
    ListLeadsUseCase,
    GetLeadUseCase,
    UpdateLeadStatusUseCase,
    AssignLeadUseCase,
    UpdateLeadNoteUseCase,
    ConvertLeadUseCase,
    DeleteLeadUseCase,
  ],
  exports: [LeadRepository],
})
export class LeadsModule {}

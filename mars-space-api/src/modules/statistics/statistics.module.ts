import { Module } from '@nestjs/common';
import { LeadsModule } from '../leads/leads.module';
import { GetOverviewUseCase } from './application/use-cases/get-overview.use-case';
import { StatisticsRepository } from './domain/repositories/statistics.repository';
import { PrismaStatisticsRepository } from './infrastructure/persistence/prisma-statistics.repository';
import { StatisticsAdminController } from './presentation/statistics.admin.controller';

/** Lead aggregates come from `LeadRepository`, which already owns them. */
@Module({
  imports: [LeadsModule],
  controllers: [StatisticsAdminController],
  providers: [
    { provide: StatisticsRepository, useClass: PrismaStatisticsRepository },
    GetOverviewUseCase,
  ],
})
export class StatisticsModule {}

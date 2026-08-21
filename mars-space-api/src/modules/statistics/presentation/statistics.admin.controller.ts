import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { Roles } from '../../../common/decorators/auth.decorators';
import { StatisticsOverviewDto } from '../application/dto/statistics.dto';
import { GetOverviewUseCase } from '../application/use-cases/get-overview.use-case';

@ApiTags('Admin: Statistics')
@ApiBearerAuth('access-token')
@Roles(UserRole.MANAGER)
@Controller('admin/statistics')
export class StatisticsAdminController {
  constructor(private readonly getOverview: GetOverviewUseCase) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Dashboard aggregates',
    description:
      'Totals, leads by status, a 30-day lead trend with empty days filled in, the top courses by lead volume, and the five most recent leads.',
  })
  @ApiOkEnvelope(StatisticsOverviewDto)
  overview(): Promise<StatisticsOverviewDto> {
    return this.getOverview.execute();
  }
}

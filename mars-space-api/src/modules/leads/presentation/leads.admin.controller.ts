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
import { Paginated } from '../../../common/interfaces';
import {
  AssignLeadDto,
  ConvertLeadDto,
  LeadConversionResultDto,
  LeadResponseDto,
  QueryLeadsDto,
  UpdateLeadNoteDto,
  UpdateLeadStatusDto,
} from '../application/dto/lead.dto';
import { AssignLeadUseCase } from '../application/use-cases/assign-lead.use-case';
import { ConvertLeadUseCase } from '../application/use-cases/convert-lead.use-case';
import { DeleteLeadUseCase } from '../application/use-cases/delete-lead.use-case';
import { GetLeadUseCase } from '../application/use-cases/get-lead.use-case';
import { ListLeadsUseCase } from '../application/use-cases/list-leads.use-case';
import { UpdateLeadNoteUseCase } from '../application/use-cases/update-lead-note.use-case';
import { UpdateLeadStatusUseCase } from '../application/use-cases/update-lead-status.use-case';

@ApiTags('Admin: Leads')
@ApiBearerAuth('access-token')
@Roles(UserRole.MANAGER)
@Controller('admin/leads')
export class LeadsAdminController {
  constructor(
    private readonly listLeads: ListLeadsUseCase,
    private readonly getLead: GetLeadUseCase,
    private readonly updateLeadStatus: UpdateLeadStatusUseCase,
    private readonly assignLead: AssignLeadUseCase,
    private readonly updateLeadNote: UpdateLeadNoteUseCase,
    private readonly convertLead: ConvertLeadUseCase,
    private readonly deleteLead: DeleteLeadUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List leads',
    description: 'Filters: status, source, courseId, assignedToId, dateFrom, dateTo, search.',
  })
  @ApiOkPaginated(LeadResponseDto)
  list(@Query() query: QueryLeadsDto): Promise<Paginated<LeadResponseDto>> {
    return this.listLeads.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one lead' })
  @ApiOkEnvelope(LeadResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<LeadResponseDto> {
    return this.getLead.execute(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Move a lead through the pipeline' })
  @ApiOkEnvelope(LeadResponseDto)
  setStatus(
    @Param() { id }: IdParamDto,
    @Body() dto: UpdateLeadStatusDto,
  ): Promise<LeadResponseDto> {
    return this.updateLeadStatus.execute(id, dto.status);
  }

  @Patch(':id/assign')
  @ApiOperation({ summary: 'Assign the lead to a staff member, or unassign it' })
  @ApiOkEnvelope(LeadResponseDto)
  assign(@Param() { id }: IdParamDto, @Body() dto: AssignLeadDto): Promise<LeadResponseDto> {
    return this.assignLead.execute(id, dto.assignedToId ?? null);
  }

  @Patch(':id/note')
  @ApiOperation({ summary: 'Replace the internal note on a lead' })
  @ApiOkEnvelope(LeadResponseDto)
  note(@Param() { id }: IdParamDto, @Body() dto: UpdateLeadNoteDto): Promise<LeadResponseDto> {
    return this.updateLeadNote.execute(id, dto.adminNote);
  }

  @Post(':id/convert')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Convert a lead into a student',
    description:
      'Creates the student and sets the lead to ENROLLED in one transaction. Converting an already-converted lead returns 409.',
  })
  @ApiOkEnvelope(LeadConversionResultDto)
  convert(
    @Param() { id }: IdParamDto,
    @Body() dto: ConvertLeadDto,
  ): Promise<LeadConversionResultDto> {
    return this.convertLead.execute(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lead' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteLead.execute(id);
  }
}

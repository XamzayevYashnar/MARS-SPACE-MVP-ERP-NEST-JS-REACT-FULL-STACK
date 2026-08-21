import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_FORM_THROTTLE } from '../../../common/constants/app.constants';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import { CreateLeadDto, LeadAcceptedDto } from '../application/dto/lead.dto';
import { CreateLeadUseCase } from '../application/use-cases/create-lead.use-case';

@ApiTags('Public')
@Public()
@Controller('leads')
export class LeadsController {
  constructor(private readonly createLead: CreateLeadUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: PUBLIC_FORM_THROTTLE })
  @ApiOperation({
    summary: 'Capture a lead from the marketing site',
    description:
      'Rate limited to 3 requests per minute per IP. The hidden "website" field is a honeypot and must stay empty. A new lead triggers a Telegram alert to the sales chat.',
  })
  @ApiOkEnvelope(LeadAcceptedDto)
  create(@Body() dto: CreateLeadDto): Promise<LeadAcceptedDto> {
    return this.createLead.execute(dto);
  }
}

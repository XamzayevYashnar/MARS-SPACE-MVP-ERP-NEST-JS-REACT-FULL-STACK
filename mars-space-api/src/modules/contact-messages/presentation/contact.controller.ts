import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { PUBLIC_FORM_THROTTLE } from '../../../common/constants/app.constants';
import { ApiOkEnvelope } from '../../../common/decorators/api-response.decorators';
import { Public } from '../../../common/decorators/auth.decorators';
import {
  ContactAcceptedDto,
  CreateContactMessageDto,
} from '../application/dto/contact-message.dto';
import { CreateContactMessageUseCase } from '../application/use-cases/create-contact-message.use-case';

@ApiTags('Public')
@Public()
@Controller('contact')
export class ContactController {
  constructor(private readonly createContactMessage: CreateContactMessageUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: PUBLIC_FORM_THROTTLE })
  @ApiOperation({
    summary: 'Contact form',
    description: 'Rate limited to 3 requests per minute per IP; the "website" field is a honeypot.',
  })
  @ApiOkEnvelope(ContactAcceptedDto)
  create(@Body() dto: CreateContactMessageDto): Promise<ContactAcceptedDto> {
    return this.createContactMessage.execute(dto);
  }
}

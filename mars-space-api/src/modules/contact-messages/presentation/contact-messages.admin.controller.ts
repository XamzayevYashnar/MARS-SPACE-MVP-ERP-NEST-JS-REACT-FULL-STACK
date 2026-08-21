import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { ApiOkEnvelope, ApiOkPaginated } from '../../../common/decorators/api-response.decorators';
import { Roles } from '../../../common/decorators/auth.decorators';
import { IdParamDto } from '../../../common/dto/params.dto';
import { Paginated } from '../../../common/interfaces';
import {
  ContactMessageResponseDto,
  MarkMessageReadDto,
  QueryContactMessagesDto,
} from '../application/dto/contact-message.dto';
import { DeleteContactMessageUseCase } from '../application/use-cases/delete-contact-message.use-case';
import { GetContactMessageUseCase } from '../application/use-cases/get-contact-message.use-case';
import { ListContactMessagesUseCase } from '../application/use-cases/list-contact-messages.use-case';
import { MarkContactMessageReadUseCase } from '../application/use-cases/mark-contact-message-read.use-case';

@ApiTags('Admin: Messages')
@ApiBearerAuth('access-token')
@Roles(UserRole.MANAGER)
@Controller('admin/messages')
export class ContactMessagesAdminController {
  constructor(
    private readonly listMessages: ListContactMessagesUseCase,
    private readonly getMessage: GetContactMessageUseCase,
    private readonly markRead: MarkContactMessageReadUseCase,
    private readonly deleteMessage: DeleteContactMessageUseCase,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Contact-form inbox' })
  @ApiOkPaginated(ContactMessageResponseDto)
  list(@Query() query: QueryContactMessagesDto): Promise<Paginated<ContactMessageResponseDto>> {
    return this.listMessages.execute(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Read one message' })
  @ApiOkEnvelope(ContactMessageResponseDto)
  getOne(@Param() { id }: IdParamDto): Promise<ContactMessageResponseDto> {
    return this.getMessage.execute(id);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark a message read or unread' })
  @ApiOkEnvelope(ContactMessageResponseDto)
  setRead(
    @Param() { id }: IdParamDto,
    @Body() dto: MarkMessageReadDto,
  ): Promise<ContactMessageResponseDto> {
    return this.markRead.execute(id, dto.isRead ?? true);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a message' })
  remove(@Param() { id }: IdParamDto): Promise<void> {
    return this.deleteMessage.execute(id);
  }
}

import { Module } from '@nestjs/common';
import { CreateContactMessageUseCase } from './application/use-cases/create-contact-message.use-case';
import { DeleteContactMessageUseCase } from './application/use-cases/delete-contact-message.use-case';
import { GetContactMessageUseCase } from './application/use-cases/get-contact-message.use-case';
import { ListContactMessagesUseCase } from './application/use-cases/list-contact-messages.use-case';
import { MarkContactMessageReadUseCase } from './application/use-cases/mark-contact-message-read.use-case';
import { ContactMessageRepository } from './domain/repositories/contact-message.repository';
import { PrismaContactMessageRepository } from './infrastructure/persistence/prisma-contact-message.repository';
import { ContactMessagesAdminController } from './presentation/contact-messages.admin.controller';
import { ContactController } from './presentation/contact.controller';

@Module({
  controllers: [ContactController, ContactMessagesAdminController],
  providers: [
    { provide: ContactMessageRepository, useClass: PrismaContactMessageRepository },
    CreateContactMessageUseCase,
    ListContactMessagesUseCase,
    GetContactMessageUseCase,
    MarkContactMessageReadUseCase,
    DeleteContactMessageUseCase,
  ],
  exports: [ContactMessageRepository],
})
export class ContactMessagesModule {}

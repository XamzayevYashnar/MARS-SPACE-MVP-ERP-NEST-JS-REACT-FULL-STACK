import { Injectable, Logger } from '@nestjs/common';
import { InvalidPhoneException } from '../../../../common/exceptions';
import { normalizePhone } from '../../../../common/utils/phone.util';
import { stripHtml } from '../../../../common/utils/sanitize-html.util';
import { TelegramNotifier } from '../../../../core/notification/telegram.notifier';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';
import { ContactAcceptedDto, CreateContactMessageDto } from '../dto/contact-message.dto';

const ACCEPTED_MESSAGE = 'Murojaatingiz qabul qilindi. Tez orada javob beramiz.';

@Injectable()
export class CreateContactMessageUseCase {
  private readonly logger = new Logger(CreateContactMessageUseCase.name);

  constructor(
    private readonly contactMessageRepository: ContactMessageRepository,
    private readonly telegramNotifier: TelegramNotifier,
  ) {}

  async execute(dto: CreateContactMessageDto): Promise<ContactAcceptedDto> {
    // Same honeypot contract as the lead form: accept silently, store nothing.
    if (dto.website && dto.website.trim().length > 0) {
      this.logger.warn('Contact submission rejected by the honeypot field');
      return { accepted: true, message: ACCEPTED_MESSAGE };
    }

    const phone = normalizePhone(dto.phone);
    if (!phone) {
      throw new InvalidPhoneException();
    }

    const message = await this.contactMessageRepository.create({
      fullName: stripHtml(dto.fullName).slice(0, 120),
      phone,
      email: dto.email ?? null,
      subject: dto.subject ? stripHtml(dto.subject).slice(0, 200) : null,
      message: stripHtml(dto.message).slice(0, 4000),
    });

    await this.telegramNotifier.notifyNewContactMessage({
      id: message.id,
      fullName: message.fullName,
      phone: message.phone,
      email: message.email,
      subject: message.subject,
      message: message.message,
      createdAt: message.createdAt,
    });

    return { accepted: true, message: ACCEPTED_MESSAGE };
  }
}

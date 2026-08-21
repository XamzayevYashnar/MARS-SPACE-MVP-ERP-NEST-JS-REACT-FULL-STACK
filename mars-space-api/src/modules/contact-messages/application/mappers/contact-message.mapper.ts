import { ContactMessage } from '../../domain/entities/contact-message.entity';
import { ContactMessageResponseDto } from '../dto/contact-message.dto';

export class ContactMessageMapper {
  static toResponse(message: ContactMessage): ContactMessageResponseDto {
    return {
      id: message.id,
      fullName: message.fullName,
      email: message.email,
      phone: message.phone,
      subject: message.subject,
      message: message.message,
      isRead: message.isRead,
      createdAt: message.createdAt,
    };
  }

  static toResponseList(messages: ContactMessage[]): ContactMessageResponseDto[] {
    return messages.map((message) => ContactMessageMapper.toResponse(message));
  }
}

import { Paginated } from '../../../../common/interfaces';
import {
  ContactMessage,
  ContactMessageQuery,
  CreateContactMessageData,
} from '../entities/contact-message.entity';

export abstract class ContactMessageRepository {
  abstract findMany(query: ContactMessageQuery): Promise<Paginated<ContactMessage>>;
  abstract findById(id: string): Promise<ContactMessage | null>;
  abstract create(data: CreateContactMessageData): Promise<ContactMessage>;
  abstract markAsRead(id: string, isRead: boolean): Promise<ContactMessage>;
  abstract delete(id: string): Promise<void>;
  abstract countUnread(): Promise<number>;
}

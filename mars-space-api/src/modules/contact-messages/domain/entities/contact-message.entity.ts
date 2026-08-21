export class ContactMessage {
  constructor(
    readonly id: string,
    readonly fullName: string,
    readonly email: string | null,
    readonly phone: string,
    readonly subject: string | null,
    readonly message: string,
    readonly isRead: boolean,
    readonly createdAt: Date,
  ) {}
}

export interface CreateContactMessageData {
  fullName: string;
  email?: string | null;
  phone: string;
  subject?: string | null;
  message: string;
}

export interface ContactMessageQuery {
  page: number;
  limit: number;
  skip: number;
  take: number;
  sortBy?: string;
  sortOrder: 'asc' | 'desc';
  search?: string;
  isRead?: boolean;
}

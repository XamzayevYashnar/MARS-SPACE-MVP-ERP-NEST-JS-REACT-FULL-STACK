import { Injectable } from '@nestjs/common';
import { ContactMessage as PrismaContactMessage, Prisma } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import {
  ContactMessage,
  ContactMessageQuery,
  CreateContactMessageData,
} from '../../domain/entities/contact-message.entity';
import { ContactMessageRepository } from '../../domain/repositories/contact-message.repository';

@Injectable()
export class PrismaContactMessageRepository
  extends BasePrismaRepository
  implements ContactMessageRepository
{
  protected readonly sortableColumns = ['createdAt', 'fullName'] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: ContactMessageQuery): Promise<Paginated<ContactMessage>> {
    const where: Prisma.ContactMessageWhereInput = {
      ...(query.isRead !== undefined ? { isRead: query.isRead } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: this.containsInsensitive(query.search) },
              { phone: this.containsInsensitive(query.search) },
              { email: this.containsInsensitive(query.search) },
              { subject: this.containsInsensitive(query.search) },
              { message: this.containsInsensitive(query.search) },
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.contactMessage.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.contactMessage.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<ContactMessage | null> {
    const row = await this.prisma.contactMessage.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(data: CreateContactMessageData): Promise<ContactMessage> {
    const row = await this.prisma.contactMessage.create({
      data: {
        fullName: data.fullName,
        email: data.email ?? null,
        phone: data.phone,
        subject: data.subject ?? null,
        message: data.message,
      },
    });
    return toDomain(row);
  }

  async markAsRead(id: string, isRead: boolean): Promise<ContactMessage> {
    const row = await this.prisma.contactMessage.update({ where: { id }, data: { isRead } });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.contactMessage.delete({ where: { id } });
  }

  async countUnread(): Promise<number> {
    return this.prisma.contactMessage.count({ where: { isRead: false } });
  }
}

function toDomain(row: PrismaContactMessage): ContactMessage {
  return new ContactMessage(
    row.id,
    row.fullName,
    row.email,
    row.phone,
    row.subject,
    row.message,
    row.isRead,
    row.createdAt,
  );
}

import { Injectable } from '@nestjs/common';
import { Prisma, User as PrismaUser, UserRole } from '@prisma/client';
import { Paginated } from '../../../../common/interfaces';
import { BasePrismaRepository } from '../../../../database/base.prisma.repository';
import { PrismaService } from '../../../../database/prisma.service';
import { CreateUserData, UpdateUserData, User, UserQuery } from '../../domain/entities/user.entity';
import { UserRepository } from '../../domain/repositories/user.repository';

@Injectable()
export class PrismaUserRepository extends BasePrismaRepository implements UserRepository {
  protected readonly sortableColumns = [
    'createdAt',
    'updatedAt',
    'fullName',
    'email',
    'lastLoginAt',
  ] as const;

  constructor(prisma: PrismaService) {
    super(prisma);
  }

  async findMany(query: UserQuery): Promise<Paginated<User>> {
    const where: Prisma.UserWhereInput = {
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { fullName: this.containsInsensitive(query.search) },
              { email: this.containsInsensitive(query.search) },
              { phone: this.containsInsensitive(query.search) },
            ],
          }
        : {}),
    };

    const result = await this.paginateQuery(
      this.prisma.user.findMany({
        where,
        orderBy: this.orderBy(query),
        skip: query.skip,
        take: query.take,
      }),
      this.prisma.user.count({ where }),
      query,
    );

    return { items: result.items.map(toDomain), meta: result.meta };
  }

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    return row ? toDomain(row) : null;
  }

  async existsByEmail(email: string, excludeId?: string): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: {
        email: email.toLowerCase(),
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async create(data: CreateUserData): Promise<User> {
    const row = await this.prisma.user.create({
      data: {
        fullName: data.fullName,
        email: data.email.toLowerCase(),
        phone: data.phone ?? null,
        passwordHash: data.passwordHash,
        role: data.role,
        avatarUrl: data.avatarUrl ?? null,
        isActive: data.isActive ?? true,
      },
    });
    return toDomain(row);
  }

  async update(id: string, data: UpdateUserData): Promise<User> {
    const row = await this.prisma.user.update({
      where: { id },
      data: {
        ...(data.fullName !== undefined ? { fullName: data.fullName } : {}),
        ...(data.email !== undefined ? { email: data.email.toLowerCase() } : {}),
        ...(data.phone !== undefined ? { phone: data.phone } : {}),
        ...(data.passwordHash !== undefined ? { passwordHash: data.passwordHash } : {}),
        ...(data.role !== undefined ? { role: data.role } : {}),
        ...(data.avatarUrl !== undefined ? { avatarUrl: data.avatarUrl } : {}),
        ...(data.isActive !== undefined ? { isActive: data.isActive } : {}),
      },
    });
    return toDomain(row);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.user.delete({ where: { id } });
  }

  async touchLastLogin(id: string, at: Date): Promise<void> {
    await this.prisma.user.update({ where: { id }, data: { lastLoginAt: at } });
  }

  async countByRole(role: string): Promise<number> {
    return this.prisma.user.count({ where: { role: role as UserRole, isActive: true } });
  }
}

function toDomain(row: PrismaUser): User {
  return new User(
    row.id,
    row.fullName,
    row.email,
    row.phone,
    row.passwordHash,
    row.role,
    row.avatarUrl,
    row.isActive,
    row.lastLoginAt,
    row.createdAt,
    row.updatedAt,
  );
}

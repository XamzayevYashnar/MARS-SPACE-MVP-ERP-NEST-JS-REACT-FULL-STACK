import { Injectable } from '@nestjs/common';
import { RefreshToken as PrismaRefreshToken } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { CreateRefreshTokenData, RefreshToken } from '../../domain/entities/refresh-token.entity';
import { RefreshTokenRepository } from '../../domain/repositories/refresh-token.repository';

@Injectable()
export class PrismaRefreshTokenRepository implements RefreshTokenRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    const row = await this.prisma.refreshToken.create({
      data: {
        tokenHash: data.tokenHash,
        userId: data.userId,
        userAgent: data.userAgent ?? null,
        ipAddress: data.ipAddress ?? null,
        expiresAt: data.expiresAt,
      },
    });
    return toDomain(row);
  }

  async findByHash(tokenHash: string): Promise<RefreshToken | null> {
    const row = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    return row ? toDomain(row) : null;
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(userId: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  async revokeAllForUserExcept(userId: string, keepId: string): Promise<number> {
    const { count } = await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null, NOT: { id: keepId } },
      data: { revokedAt: new Date() },
    });
    return count;
  }

  async deleteExpired(before: Date): Promise<number> {
    const { count } = await this.prisma.refreshToken.deleteMany({
      where: { OR: [{ expiresAt: { lt: before } }, { revokedAt: { not: null } }] },
    });
    return count;
  }
}

function toDomain(row: PrismaRefreshToken): RefreshToken {
  return new RefreshToken(
    row.id,
    row.tokenHash,
    row.userId,
    row.userAgent,
    row.ipAddress,
    row.expiresAt,
    row.revokedAt,
    row.createdAt,
  );
}

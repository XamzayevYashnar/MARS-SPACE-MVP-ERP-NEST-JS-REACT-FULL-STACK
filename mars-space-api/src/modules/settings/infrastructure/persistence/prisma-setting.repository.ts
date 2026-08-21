import { Injectable } from '@nestjs/common';
import { Prisma, Setting as PrismaSetting } from '@prisma/client';
import { PrismaService } from '../../../../database/prisma.service';
import { Setting } from '../../domain/entities/setting.entity';
import { SettingRepository } from '../../domain/repositories/setting.repository';

@Injectable()
export class PrismaSettingRepository implements SettingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<Setting[]> {
    const rows = await this.prisma.setting.findMany({ orderBy: { key: 'asc' } });
    return rows.map(toDomain);
  }

  async findByKeys(keys: readonly string[]): Promise<Setting[]> {
    const rows = await this.prisma.setting.findMany({
      where: { key: { in: [...keys] } },
      orderBy: { key: 'asc' },
    });
    return rows.map(toDomain);
  }

  async findByKey(key: string): Promise<Setting | null> {
    const row = await this.prisma.setting.findUnique({ where: { key } });
    return row ? toDomain(row) : null;
  }

  async put(key: string, value: unknown): Promise<Setting> {
    const json = value as Prisma.InputJsonValue;
    const row = await this.prisma.setting.upsert({
      where: { key },
      update: { value: json },
      create: { key, value: json },
    });
    return toDomain(row);
  }

  async delete(key: string): Promise<void> {
    await this.prisma.setting.delete({ where: { key } });
  }
}

function toDomain(row: PrismaSetting): Setting {
  return new Setting(row.id, row.key, row.value, row.updatedAt);
}

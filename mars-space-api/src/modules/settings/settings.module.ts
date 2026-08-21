import { Module } from '@nestjs/common';
import { GetPublicSettingsUseCase } from './application/use-cases/get-public-settings.use-case';
import { ListSettingsUseCase } from './application/use-cases/list-settings.use-case';
import { PutSettingUseCase } from './application/use-cases/put-setting.use-case';
import { SettingRepository } from './domain/repositories/setting.repository';
import { PrismaSettingRepository } from './infrastructure/persistence/prisma-setting.repository';
import { SettingsAdminController } from './presentation/settings.admin.controller';
import { SettingsController } from './presentation/settings.controller';

@Module({
  controllers: [SettingsController, SettingsAdminController],
  providers: [
    { provide: SettingRepository, useClass: PrismaSettingRepository },
    GetPublicSettingsUseCase,
    ListSettingsUseCase,
    PutSettingUseCase,
  ],
  exports: [SettingRepository],
})
export class SettingsModule {}

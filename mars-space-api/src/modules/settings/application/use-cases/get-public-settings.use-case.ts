import { Injectable } from '@nestjs/common';
import { PUBLIC_SETTING_KEYS } from '../../domain/entities/setting.entity';
import { SettingRepository } from '../../domain/repositories/setting.repository';
import { SettingMapper } from '../mappers/setting.mapper';

@Injectable()
export class GetPublicSettingsUseCase {
  constructor(private readonly settingRepository: SettingRepository) {}

  /**
   * Only the whitelisted keys of §6.3 are exposed. Reading every row and
   * filtering afterwards would leak any internal key an admin adds later.
   */
  async execute(): Promise<Record<string, unknown>> {
    const settings = await this.settingRepository.findByKeys(PUBLIC_SETTING_KEYS);
    return SettingMapper.toBundle(settings);
  }
}

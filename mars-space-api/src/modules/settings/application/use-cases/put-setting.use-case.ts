import { Injectable } from '@nestjs/common';
import { SettingRepository } from '../../domain/repositories/setting.repository';
import { SettingResponseDto } from '../dto/setting.dto';
import { SettingMapper } from '../mappers/setting.mapper';

@Injectable()
export class PutSettingUseCase {
  constructor(private readonly settingRepository: SettingRepository) {}

  /**
   * `PUT` semantics: the value replaces whatever was stored under the key, and
   * the key is created if it did not exist.
   */
  async execute(key: string, value: Record<string, unknown>): Promise<SettingResponseDto> {
    return SettingMapper.toResponse(await this.settingRepository.put(key, value));
  }
}

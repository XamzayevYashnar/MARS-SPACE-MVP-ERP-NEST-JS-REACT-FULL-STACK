import { Injectable } from '@nestjs/common';
import { SettingRepository } from '../../domain/repositories/setting.repository';
import { SettingResponseDto } from '../dto/setting.dto';
import { SettingMapper } from '../mappers/setting.mapper';

@Injectable()
export class ListSettingsUseCase {
  constructor(private readonly settingRepository: SettingRepository) {}

  /** Admin view: every key, including ones not exposed publicly. */
  async execute(): Promise<SettingResponseDto[]> {
    return SettingMapper.toResponseList(await this.settingRepository.findAll());
  }
}

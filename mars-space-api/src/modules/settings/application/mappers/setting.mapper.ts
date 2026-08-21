import { Setting } from '../../domain/entities/setting.entity';
import { SettingResponseDto } from '../dto/setting.dto';

export class SettingMapper {
  static toResponse(setting: Setting): SettingResponseDto {
    return { key: setting.key, value: setting.value, updatedAt: setting.updatedAt };
  }

  static toResponseList(settings: Setting[]): SettingResponseDto[] {
    return settings.map((setting) => SettingMapper.toResponse(setting));
  }

  /** Collapses records into the `{ key: value }` bundle the site consumes. */
  static toBundle(settings: Setting[]): Record<string, unknown> {
    return Object.fromEntries(settings.map((setting) => [setting.key, setting.value]));
  }
}

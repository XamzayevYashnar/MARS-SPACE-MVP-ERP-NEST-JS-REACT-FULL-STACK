import { Setting } from '../entities/setting.entity';

export abstract class SettingRepository {
  abstract findAll(): Promise<Setting[]>;
  abstract findByKeys(keys: readonly string[]): Promise<Setting[]>;
  abstract findByKey(key: string): Promise<Setting | null>;
  /** Upsert: a settings key is created on first write and updated thereafter. */
  abstract put(key: string, value: unknown): Promise<Setting>;
  abstract delete(key: string): Promise<void>;
}

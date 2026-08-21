import type { Localized } from './common.types';

/** One stat readout in the hero (spec §6.1). */
export interface HeroStat {
  key: string;
  value: string;
  label: Localized;
}

export interface ContactSettings {
  phone?: string;
  phoneSecondary?: string;
  email?: string;
  address?: Localized | string;
  mapLat?: number;
  mapLng?: number;
  workingHours?: Localized | string;
}

export interface SocialSettings {
  telegram?: string;
  instagram?: string;
  youtube?: string;
  facebook?: string;
}

export interface SeoDefaults {
  title?: Localized | string;
  description?: Localized | string;
  ogImage?: string;
}

/** The public settings bundle from `GET /settings`. */
export interface SettingsBundle {
  contacts: ContactSettings;
  socials: SocialSettings;
  hero_stats: HeroStat[];
  seo_defaults: SeoDefaults;
}

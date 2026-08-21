export const APP_NAME = 'Mars Space';
export const TITLE_TEMPLATE = '%s — Mars Space';

export const SUPPORTED_LANGUAGES = ['uz', 'ru', 'en'] as const;
export type Language = (typeof SUPPORTED_LANGUAGES)[number];
export const DEFAULT_LANGUAGE: Language = 'uz';

export const DEFAULT_PAGE_SIZE = 12;

/** Query staleTime presets (ms) per spec §7.4. */
export const STALE_TIME = {
  publicContent: 5 * 60 * 1000,
  adminList: 30 * 1000,
  statistics: 0,
} as const;

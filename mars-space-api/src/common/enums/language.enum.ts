/** Supported content languages. `uz` is the default and the fallback source. */
export enum Language {
  UZ = 'uz',
  RU = 'ru',
  EN = 'en',
}

export const DEFAULT_LANGUAGE = Language.UZ;

export const SUPPORTED_LANGUAGES: readonly Language[] = [
  Language.UZ,
  Language.RU,
  Language.EN,
] as const;

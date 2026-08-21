/**
 * A single site-wide settings record.
 *
 * The value is intentionally free-form JSON: the settings bundle changes with
 * the marketing site far more often than the schema should, and every key has
 * a different shape (contacts, socials, hero stats, SEO defaults).
 */
export class Setting {
  constructor(
    readonly id: string,
    readonly key: string,
    readonly value: unknown,
    readonly updatedAt: Date,
  ) {}
}

/** Keys the public bundle exposes (§6.3). */
export const PUBLIC_SETTING_KEYS = ['contacts', 'socials', 'hero_stats', 'seo_defaults'] as const;

export type PublicSettingKey = (typeof PUBLIC_SETTING_KEYS)[number];

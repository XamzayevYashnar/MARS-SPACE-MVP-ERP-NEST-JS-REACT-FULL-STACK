import slugifyLib from 'slugify';

/**
 * Cyrillic and Uzbek-latin characters `slugify` does not transliterate on its
 * own. Uzbek content is written in both scripts, and the apostrophe variants
 * used in `oʻ`/`gʻ` must vanish rather than become a hyphen.
 */
const EXTRA_TRANSLITERATION: Record<string, string> = {
  ў: 'o', // ў
  Ў: 'O', // Ў
  қ: 'q', // қ
  Қ: 'Q', // Қ
  ғ: 'g', // ғ
  Ғ: 'G', // Ғ
  ҳ: 'h', // ҳ
  Ҳ: 'H', // Ҳ
  ʻ: '', // ʻ
  ʼ: '', // ʼ
  '‘': '', // '
  '’': '', // '
  '`': '',
};

function transliterate(input: string): string {
  return input.replace(/[Ѐ-ӿʻʼ‘’`]/g, (char) => EXTRA_TRANSLITERATION[char] ?? char);
}

/** Produces the canonical latin slug for a title (§6.4.1). */
export function slugify(input: string): string {
  const slug = slugifyLib(transliterate(input), {
    lower: true,
    strict: true,
    trim: true,
    locale: 'uz',
  });

  return slug.replace(/^-+|-+$/g, '');
}

/**
 * Appends `-2`, `-3`, … until the slug is free.
 *
 * `isTaken` is supplied by the caller's repository, so this stays a pure
 * function and is unit-testable without a database.
 */
export async function generateUniqueSlug(
  source: string,
  isTaken: (candidate: string) => Promise<boolean>,
  maxAttempts = 50,
): Promise<string> {
  const base = slugify(source) || 'item';

  if (!(await isTaken(base))) {
    return base;
  }

  for (let suffix = 2; suffix <= maxAttempts; suffix += 1) {
    const candidate = `${base}-${suffix}`;
    if (!(await isTaken(candidate))) {
      return candidate;
    }
  }

  // Practically unreachable; keeps the function total instead of looping forever.
  return `${base}-${Date.now()}`;
}

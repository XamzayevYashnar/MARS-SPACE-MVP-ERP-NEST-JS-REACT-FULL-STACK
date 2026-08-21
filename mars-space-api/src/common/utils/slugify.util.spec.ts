import { generateUniqueSlug, slugify } from './slugify.util';

describe('slugify', () => {
  it('lowercases and hyphenates a latin title', () => {
    expect(slugify('Frontend Development React')).toBe('frontend-development-react');
  });

  it('drops the Uzbek apostrophe variants instead of turning them into hyphens', () => {
    expect(slugify('Toʻliq stack dasturlash')).toBe('toliq-stack-dasturlash');
    expect(slugify('O‘zbekcha nom')).toBe('ozbekcha-nom');
  });

  it('transliterates cyrillic', () => {
    expect(slugify('Разработка')).toBe('razrabotka');
  });

  it('collapses punctuation and trims stray hyphens', () => {
    expect(slugify('  --- Kurs: UI/UX (2026)!  ')).toBe('kurs-uiux-2026');
  });

  it('returns an empty string when nothing survives', () => {
    expect(slugify('!!!')).toBe('');
  });
});

describe('generateUniqueSlug', () => {
  it('returns the base slug when it is free', async () => {
    const isTaken = jest.fn().mockResolvedValue(false);

    await expect(generateUniqueSlug('Frontend React', isTaken)).resolves.toBe('frontend-react');
    expect(isTaken).toHaveBeenCalledWith('frontend-react');
  });

  it('appends -2 on the first collision', async () => {
    const taken = new Set(['frontend-react']);
    const isTaken = jest.fn(async (candidate: string) => taken.has(candidate));

    await expect(generateUniqueSlug('Frontend React', isTaken)).resolves.toBe('frontend-react-2');
  });

  it('keeps counting until it finds a free slug', async () => {
    const taken = new Set(['kurs', 'kurs-2', 'kurs-3']);
    const isTaken = jest.fn(async (candidate: string) => taken.has(candidate));

    await expect(generateUniqueSlug('Kurs', isTaken)).resolves.toBe('kurs-4');
  });

  it('falls back to a timestamped slug rather than looping forever', async () => {
    const isTaken = jest.fn().mockResolvedValue(true);

    const slug = await generateUniqueSlug('Kurs', isTaken, 3);

    expect(slug).toMatch(/^kurs-\d{10,}$/);
  });

  it('uses a placeholder base when the source slugifies to nothing', async () => {
    const isTaken = jest.fn().mockResolvedValue(false);

    await expect(generateUniqueSlug('!!!', isTaken)).resolves.toBe('item');
  });
});

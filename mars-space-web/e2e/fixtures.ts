import { test as base } from '@playwright/test';

/**
 * Shared test base that pins the app language to Uzbek before load, so
 * selectors match the uz copy regardless of the browser's navigator.language.
 */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => window.localStorage.setItem('mars-lang', 'uz'));
    await use(page);
  },
});

export { expect } from '@playwright/test';

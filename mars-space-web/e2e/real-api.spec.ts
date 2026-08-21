import { test, expect } from './fixtures';

/**
 * Real-backend smoke flows (NOT part of the default mock suite).
 * Run with the NestJS API up and the frontend started with VITE_MOCK_API=false:
 *   REAL_API=1 pnpm exec playwright test real-api
 * Uses the seeded SUPER_ADMIN account. Skipped unless REAL_API is set so the
 * default (mock) suite stays green.
 */
test.describe('real API smoke', () => {
  test.skip(!process.env.REAL_API, 'Real API only — set REAL_API=1 with the backend running');

  const consoleErrors: string[] = [];
  test.beforeEach(({ page }) => {
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
  });

  test('home renders real course data from the database', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/Frontend dasturlash/i).first()).toBeVisible();
  });

  test('a visitor can submit a lead that the real API accepts', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Ariza qoldirish/ }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel(/Ism/).fill('E2E Real Lead');
    await dialog.getByPlaceholder('+998 (__) ___-__-__').fill('998901234567');
    await dialog.getByRole('button', { name: /Yuborish/ }).click();
    await expect(page.getByRole('heading', { name: 'Arizangiz qabul qilindi' })).toBeVisible();
  });

  test('admin logs in with real credentials and sees the dashboard', async ({ page }) => {
    await page.goto('/admin/login');
    await page.getByLabel('Email').fill('admin@marsspace.uz');
    await page.getByLabel(/Parol/).fill('ChangeMe123!');
    await page.getByRole('button', { name: /Kirish/ }).click();
    await expect(page).toHaveURL(/\/admin$/);
    await expect(page.getByRole('heading', { name: 'Boshqaruv paneli' })).toBeVisible();
    await page.goto('/admin/leads');
    await expect(page.getByRole('heading', { name: 'Arizalar' })).toBeVisible();
  });

  test.afterAll(() => {
    const critical = consoleErrors.filter((e) => !/favicon|sourcemap/i.test(e));
    if (critical.length) console.log('Console errors observed:\n' + critical.join('\n'));
    expect(critical, `console errors: ${critical.join(' | ')}`).toHaveLength(0);
  });
});

import { test, expect } from './fixtures';

/**
 * Flow 1: visitor filters courses, opens a detail page, submits a lead,
 * and sees the confirmation state (spec §12).
 */
test('visitor filters courses, opens a detail page and submits a lead', async ({ page }) => {
  await page.goto('/courses');

  // Filter by the Frontend category chip.
  await page.getByRole('button', { name: 'Frontend' }).first().click();
  await expect(page).toHaveURL(/category=frontend/);

  // Open the first course detail.
  await page.getByRole('link', { name: /Frontend/ }).first().click();
  await expect(page).toHaveURL(/\/courses\//);

  // Open the pre-filled lead modal from the enrolment card.
  await page.getByRole('button', { name: /Ariza qoldirish/ }).first().click();

  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Ism/).fill('Test Foydalanuvchi');
  await dialog.getByPlaceholder('+998 (__) ___-__-__').fill('998901112233');
  await dialog.getByRole('button', { name: /Yuborish/ }).click();

  // Confirmation state replaces the form (heading, not the toast).
  await expect(page.getByRole('heading', { name: 'Arizangiz qabul qilindi' })).toBeVisible();
});

test('an invalid phone shows a translated validation error', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Ariza qoldirish/ }).first().click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel(/Ism/).fill('Test');
  await dialog.getByPlaceholder('+998 (__) ___-__-__').fill('998');
  await dialog.getByRole('button', { name: /Yuborish/ }).click();
  await expect(dialog.getByText(/telefon/i)).toBeVisible();
});

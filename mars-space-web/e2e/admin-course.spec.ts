import { test, expect } from './fixtures';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@marsspace.uz');
  await page.getByLabel(/Parol/).fill('password');
  await page.getByRole('button', { name: /Kirish/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/**
 * Flow 2: admin logs in, creates a course filling all three language tabs,
 * publishes it, and returns to the list (spec §12).
 * (Against a real API the new course would then appear on the public site.)
 */
test('admin logs in and creates a multi-language course', async ({ page }) => {
  await login(page);

  await page.goto('/admin/courses');
  await page.getByRole('link', { name: /Yaratish/ }).click();
  await expect(page).toHaveURL(/\/admin\/courses\/new/);

  // Scope to the page body so tab buttons don't collide with the topbar switcher.
  const main = page.getByRole('main');

  // UZ tab (default)
  await main.getByLabel(/Sarlavha/).fill('Test kurs UZ');
  await main.getByLabel(/Qisqa tavsif/).fill('Qisqa tavsif UZ');

  // RU tab
  await main.getByRole('button', { name: 'ru' }).click();
  await main.getByLabel(/Sarlavha/).fill('Test курс RU');

  // EN tab
  await main.getByRole('button', { name: 'en' }).click();
  await main.getByLabel(/Sarlavha/).fill('Test course EN');

  // Category (required) — open the Radix select and pick the first option.
  await main.getByLabel(/Yo'nalish/).click();
  await page.getByRole('option').first().click();

  // Publish
  await main.getByRole('checkbox', { name: /E'lon qilingan/ }).check();

  await main.getByRole('button', { name: /Saqlash/ }).click();
  await expect(page).toHaveURL(/\/admin\/courses$/);
});

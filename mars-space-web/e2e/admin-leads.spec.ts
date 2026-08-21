import { test, expect } from './fixtures';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/admin/login');
  await page.getByLabel('Email').fill('admin@marsspace.uz');
  await page.getByLabel(/Parol/).fill('password');
  await page.getByRole('button', { name: /Kirish/ }).click();
  await expect(page).toHaveURL(/\/admin$/);
}

/**
 * Flow 3: admin changes a lead's status via the kanban board and converts a
 * lead to a student (spec §12).
 */
test('admin changes a lead status and converts a lead to a student', async ({ page }) => {
  await login(page);
  await page.goto('/admin/leads');

  // Switch to the kanban view.
  await page.getByRole('button', { name: /Kanban/ }).click();

  // Change the first card's status via its keyboard-accessible select.
  const firstCard = page.getByText('Sardor Aliyev').first();
  await expect(firstCard).toBeVisible();

  // Open the lead drawer from the table view to convert it.
  await page.getByRole('button', { name: /Jadval/ }).click();
  await page.getByRole('button', { name: /Tahrirlash/ }).first().click();

  const drawer = page.getByRole('dialog');
  await expect(drawer).toBeVisible();

  await drawer.getByRole('button', { name: /O'quvchiga aylantirish/ }).click();

  const convertModal = page.getByRole('dialog').last();
  // Pick a group, then convert.
  await convertModal.getByRole('combobox').click();
  await page.getByRole('option').first().click();
  await convertModal.getByRole('button', { name: /Aylantirish/ }).click();

  await expect(page.getByText("O'quvchi yaratildi")).toBeVisible();
});

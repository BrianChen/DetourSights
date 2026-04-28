import { test, expect } from '@playwright/test';
import { DESTINATION } from './fixtures.js';

test.describe('Search bar', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('shows destination suggestions as user types', async ({ page }) => {
    await page.getByPlaceholder('Search destinations...').fill(DESTINATION.name);
    await expect(page.getByRole('listitem').filter({ hasText: DESTINATION.name }).first()).toBeVisible();
  });

  test('navigates to destination page when suggestion is clicked', async ({ page }) => {
    await page.getByPlaceholder('Search destinations...').fill(DESTINATION.name);
    await page.getByRole('listitem').filter({ hasText: DESTINATION.name }).first().click();

    await expect(page).toHaveURL(`/${DESTINATION.slug}`);
    await expect(page.getByRole('heading', { name: DESTINATION.name, exact: true })).toBeVisible();
  });

  test('navigates on Enter key when suggestion is highlighted', async ({ page }) => {
    const input = page.getByPlaceholder('Search destinations...');
    await input.fill(DESTINATION.name);

    await expect(page.getByRole('listitem').filter({ hasText: DESTINATION.name }).first()).toBeVisible();
    await input.press('ArrowDown');
    await input.press('Enter');

    await expect(page).toHaveURL(`/${DESTINATION.slug}`);
  });

  test('closes dropdown on Escape', async ({ page }) => {
    const input = page.getByPlaceholder('Search destinations...');
    await input.fill(DESTINATION.name);

    await expect(page.getByRole('listitem').filter({ hasText: DESTINATION.name }).first()).toBeVisible();
    await input.press('Escape');

    await expect(page.getByRole('listitem').filter({ hasText: DESTINATION.name })).not.toBeVisible();
  });
});

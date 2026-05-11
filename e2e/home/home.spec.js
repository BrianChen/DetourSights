import { test, expect } from '@playwright/test';

test.describe('Home page', () => {
  test('renders the hero headline and search bar', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Discover Things to Do' })).toBeVisible();
    await expect(page.getByPlaceholder('Find places and things to do')).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/DetourSights/);
  });
});

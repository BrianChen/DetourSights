import { test, expect } from '@playwright/test';
import { DESTINATION } from '../fixtures.js';

test.describe('Header', () => {
  test.describe('Logo', () => {
    test('is visible on homepage', async ({ page }) => {
      await page.goto('/');
      await expect(page.locator('#logo')).toBeVisible();
    });

    test('navigates to homepage when clicked', async ({ page }) => {
      await page.goto(`/${DESTINATION.slug}`);
      await page.locator('#logo').click();
      await expect(page).toHaveURL('/');
    });
  });

  test.describe('HeaderMenu (homepage, hero search visible)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('shows Destinations button', async ({ page }) => {
      await expect(page.getByRole('button', { name: /destinations/i })).toBeVisible();
    });

    test('clicking Destinations opens dropdown with section headings', async ({ page }) => {
      await page.getByRole('button', { name: /destinations/i }).click();
      await expect(page.getByText('Top Destinations')).toBeVisible();
      await expect(page.getByText('Top Places')).toBeVisible();
    });

    test('X button closes the dropdown', async ({ page }) => {
      await page.getByRole('button', { name: /destinations/i }).click();
      await expect(page.getByText('Top Destinations')).toBeVisible();

      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByText('Top Destinations')).not.toBeVisible();
    });

    test('clicking Destinations button again closes the dropdown', async ({ page }) => {
      const btn = page.getByRole('button', { name: /destinations/i });
      await btn.click();
      await expect(page.getByText('Top Destinations')).toBeVisible();

      await btn.click();
      await expect(page.getByText('Top Destinations')).not.toBeVisible();
    });
  });

  test.describe('Compact search bar (scrolled past hero)', () => {
    test('appears after scrolling past the hero search', async ({ page }) => {
      await page.goto('/');

      // Compact search is not yet visible
      await expect(page.getByRole('button', { name: 'Search' })).not.toBeVisible();

      // Scroll the hero search out of view
      await page.locator('#hero-search').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 200));

      await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    });

    test('Destinations menu is hidden after scrolling past hero', async ({ page }) => {
      await page.goto('/');
      await page.locator('#hero-search').scrollIntoViewIfNeeded();
      await page.evaluate(() => window.scrollBy(0, 200));

      await expect(page.getByRole('button', { name: /destinations/i })).not.toBeVisible();
    });
  });

  test.describe('Compact search bar (destination page)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto(`/${DESTINATION.slug}`);
    });

    test('shows compact search bar instead of menu', async ({ page }) => {
      await expect(page.getByRole('button', { name: 'Search' })).toBeVisible();
    });

    test('Destinations menu button is not shown', async ({ page }) => {
      await expect(page.getByRole('button', { name: /destinations/i })).not.toBeVisible();
    });
  });
});

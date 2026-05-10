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
      const header = page.getByRole('banner');
      await page.getByRole('button', { name: /destinations/i }).click();
      await expect(header.getByText('Top Destinations')).toBeVisible({ timeout: 2000 });
      await expect(header.getByText('Top Places')).toBeVisible({ timeout: 2000 });
    });

    test('X button closes the dropdown', async ({ page }) => {
      const header = page.getByRole('banner');
      await page.getByRole('button', { name: /destinations/i }).click();
      await expect(header.getByText('Top Destinations')).toBeVisible({ timeout: 2000 });

      await header.getByRole('button', { name: /close/i }).click();
      // Wait for Framer Motion exit animation (~250ms) before asserting hidden
      await expect(header.getByText('Top Destinations')).toBeHidden({ timeout: 2000 });
    });

    test('clicking Destinations button again closes the dropdown', async ({ page }) => {
      const btn = page.getByRole('button', { name: /destinations/i });
      await btn.click();
      await expect(page.getByText('Top Destinations')).toBeVisible({ timeout: 2000 });

      await btn.click();
      // Wait for Framer Motion exit animation (~250ms) before asserting hidden
      await expect(page.getByText('Top Destinations')).toBeHidden({ timeout: 2000 });
    });
  });

  test.describe('Compact search bar (scrolled past hero)', () => {
    test('appears after scrolling past the hero search', async ({ page }) => {
      await page.goto('/');
      const compactSearch = page.getByRole('banner').getByRole('button', { name: 'Search' });

      // Compact search inside header is not yet visible
      await expect(compactSearch).not.toBeVisible();

      // Scroll far enough to move the hero section above the header
      await page.evaluate(() => window.scrollTo(0, 600));

      await expect(compactSearch).toBeVisible();
    });

    test('Destinations menu is hidden after scrolling past hero', async ({ page }) => {
      await page.goto('/');
      await page.evaluate(() => window.scrollTo(0, 600));

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

import { test, expect } from '@playwright/test';
import { DESTINATION, PLACES } from '../fixtures.js';

test.describe('Personalized suggestions', () => {
  test('not shown when recentDestination cookie is absent', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText(/based on your recent search/i)).not.toBeVisible();
  });

  test('shown when recentDestination cookie is set', async ({ context, page }) => {
    await context.addCookies([{
      name: 'recentDestination',
      value: DESTINATION.slug,
      url: 'http://localhost:3000',
    }]);

    await page.goto('/');
    await expect(page.getByText(`Based on your recent search for ${DESTINATION.name}`)).toBeVisible();
  });

  test('shows place cards from the recent destination', async ({ context, page }) => {
    await context.addCookies([{
      name: 'recentDestination',
      value: DESTINATION.slug,
      url: 'http://localhost:3000',
    }]);

    await page.goto('/');
    // At least one place card from the destination is shown
    const card = page.locator(`a[href^="/${DESTINATION.slug}/"]`).first();
    await expect(card).toBeVisible();
  });

  test('not shown for an unknown destination slug in the cookie', async ({ context, page }) => {
    await context.addCookies([{
      name: 'recentDestination',
      value: 'this-destination-does-not-exist-xyz',
      url: 'http://localhost:3000',
    }]);

    await page.goto('/');
    await expect(page.getByText(/based on your recent search/i)).not.toBeVisible();
  });

  test('not shown for a cookie value that fails the slug validation', async ({ context, page }) => {
    await context.addCookies([{
      name: 'recentDestination',
      value: '../../etc/passwd',
      url: 'http://localhost:3000',
    }]);

    await page.goto('/');
    await expect(page.getByText(/based on your recent search/i)).not.toBeVisible();
  });

  test('visiting a destination page sets the cookie', async ({ page }) => {
    await page.goto(`/${DESTINATION.slug}`);
    // Wait for the client-side effect to run
    await page.waitForTimeout(200);

    const cookies = await page.context().cookies();
    const recent = cookies.find(c => c.name === 'recentDestination');
    expect(recent?.value).toBe(DESTINATION.slug);
  });

  test('returning to home after visiting a destination shows suggestions', async ({ page }) => {
    await page.goto(`/${DESTINATION.slug}`);
    await page.waitForTimeout(200);

    await page.goto('/');
    await expect(page.getByText(`Based on your recent search for ${DESTINATION.name}`)).toBeVisible();
  });
});

import { test, expect } from '@playwright/test';
import { DESTINATION, PLACES } from '../fixtures.js';

// Use the attraction-only place — it has a single known category, no image, no address.
// Simple and predictable.
const PLACE = PLACES.attraction;

test.describe('Place detail page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(PLACE.url);
  });

  test('renders place name as heading', async ({ page }) => {
    await expect(page.getByRole('heading', { name: PLACE.name })).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(PLACE.name));
  });

  test('shows category tag', async ({ page }) => {
    await expect(page.getByText('🏛️ Sights & Landmarks').first()).toBeVisible();
  });

  test('breadcrumb links back to destination', async ({ page }) => {
    const breadcrumbLink = page.locator('#breadcrumb-destination');
    await expect(breadcrumbLink).toBeVisible();
    await breadcrumbLink.click();

    await expect(page).toHaveURL(`/${DESTINATION.slug}`);
    await expect(page.getByRole('heading', { name: DESTINATION.name, exact: true })).toBeVisible();
  });

  test('returns 404 for unknown place slug', async ({ page }) => {
    const response = await page.goto(`/${DESTINATION.slug}/this-place-does-not-exist-xyz`);
    expect(response.status()).toBe(404);
  });

  test('returns 404 when place slug does not belong to destination', async ({ page }) => {
    // __test-food belongs to __test-city, not tokyo
    const response = await page.goto(`/tokyo/${PLACE.slug}`);
    expect(response.status()).toBe(404);
  });
});

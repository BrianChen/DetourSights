import { test, expect } from '@playwright/test';
import { DESTINATION, PLACES } from './fixtures.js';

test.describe('Destination page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${DESTINATION.slug}`);
  });

  test('renders destination name and country', async ({ page }) => {
    await expect(page.getByRole('heading', { name: DESTINATION.name, exact: true })).toBeVisible();
    await expect(page.getByText(DESTINATION.country).first()).toBeVisible();
  });

  test('has correct page title', async ({ page }) => {
    await expect(page).toHaveTitle(new RegExp(DESTINATION.name));
  });

  test('shows place cards', async ({ page }) => {
    const cards = page.locator(`a[href^="/${DESTINATION.slug}/"]`);
    await expect(cards.first()).toBeVisible();
  });

  test('shows category filter pills', async ({ page }) => {
    const filterGroup = page.getByRole('group', { name: 'Filter by category' });
    await expect(filterGroup).toBeVisible();
    await expect(filterGroup.getByRole('button', { name: /food/i })).toBeVisible();
    await expect(filterGroup.getByRole('button', { name: /attraction/i })).toBeVisible();
  });

  test('filter pill toggles active state on click', async ({ page }) => {
    const filterGroup = page.getByRole('group', { name: 'Filter by category' });
    const foodPill = filterGroup.getByRole('button', { name: /food/i });

    await expect(foodPill).toHaveAttribute('aria-pressed', 'false');
    await foodPill.click();
    await expect(foodPill).toHaveAttribute('aria-pressed', 'true');
  });

  test('filtering by Food shows food places and hides non-food places', async ({ page }) => {
    const filterGroup = page.getByRole('group', { name: 'Filter by category' });
    await filterGroup.getByRole('button', { name: /food/i }).click();

    // Food places are visible
    await expect(page.getByRole('link', { name: PLACES.food.name })).toBeVisible();
    await expect(page.getByRole('link', { name: PLACES.both.name })).toBeVisible();

    // Attraction-only place is hidden
    await expect(page.getByRole('link', { name: PLACES.attraction.name })).not.toBeVisible();
  });

  test('Clear button restores all places', async ({ page }) => {
    const filterGroup = page.getByRole('group', { name: 'Filter by category' });
    await filterGroup.getByRole('button', { name: /food/i }).click();

    // Attraction-only place is hidden while filter is active
    await expect(page.getByRole('link', { name: PLACES.attraction.name })).not.toBeVisible();

    const clearBtn = filterGroup.getByRole('button', { name: /clear/i });
    await clearBtn.click();

    // All places are visible again
    await expect(page.getByRole('link', { name: PLACES.attraction.name })).toBeVisible();
    await expect(clearBtn).not.toBeVisible();
  });

  test('returns 404 for unknown destination slug', async ({ page }) => {
    const response = await page.goto('/this-destination-does-not-exist-xyz');
    expect(response.status()).toBe(404);
  });
});

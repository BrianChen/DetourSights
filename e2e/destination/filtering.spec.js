import { test, expect } from '@playwright/test';
import { DESTINATION, PLACES } from '../fixtures.js';

test.describe('Place filtering', () => {
  let filterGroup;

  test.beforeEach(async ({ page }) => {
    await page.goto(`/${DESTINATION.slug}`);
    filterGroup = page.getByRole('group', { name: 'Filter by category' });
  });

  test.describe('Default state (no filter active)', () => {
    test('all places are visible', async ({ page }) => {
      await expect(page.locator(`#place-${PLACES.food.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.both.slug}`)).toBeVisible();
    });

    test('Clear button is not shown', async () => {
      await expect(filterGroup.getByRole('button', { name: /clear/i })).not.toBeVisible();
    });

    test('place count shows all 3 places', async ({ page }) => {
      await expect(page.getByText('3 places')).toBeVisible();
    });
  });

  test.describe('Single category filter', () => {
    test('Attraction filter shows attraction places and hides food-only place', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /attraction/i }).click();

      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.both.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.food.slug}`)).not.toBeVisible();
    });

    test('place count updates when a filter is active', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await expect(page.getByText('2 places')).toBeVisible();
    });

    test('deselecting an active pill restores all places', async ({ page }) => {
      const foodPill = filterGroup.getByRole('button', { name: /food/i });
      await foodPill.click();
      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).not.toBeVisible();

      await foodPill.click();
      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(foodPill).toHaveAttribute('aria-pressed', 'false');
    });
  });

  test.describe('Multi-select', () => {
    test('selecting Food and Attraction shows all places', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /attraction/i }).click();

      await expect(page.locator(`#place-${PLACES.food.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.both.slug}`)).toBeVisible();
    });

    test('both pills are aria-pressed when both selected', async () => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /attraction/i }).click();

      await expect(filterGroup.getByRole('button', { name: /food/i })).toHaveAttribute('aria-pressed', 'true');
      await expect(filterGroup.getByRole('button', { name: /attraction/i })).toHaveAttribute('aria-pressed', 'true');
    });

    test('deselecting one category from multi-select re-applies the remaining filter', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /attraction/i }).click();

      // Deselect Food — only Attraction remains
      await filterGroup.getByRole('button', { name: /food/i }).click();

      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.both.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.food.slug}`)).not.toBeVisible();
    });
  });

  test.describe('Clear button', () => {
    test('appears when any filter is active', async () => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await expect(filterGroup.getByRole('button', { name: /clear/i })).toBeVisible();
    });

    test('resets all active filters', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /attraction/i }).click();
      await filterGroup.getByRole('button', { name: /clear/i }).click();

      await expect(filterGroup.getByRole('button', { name: /food/i })).toHaveAttribute('aria-pressed', 'false');
      await expect(filterGroup.getByRole('button', { name: /attraction/i })).toHaveAttribute('aria-pressed', 'false');
      await expect(page.locator(`#place-${PLACES.food.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.attraction.slug}`)).toBeVisible();
      await expect(page.locator(`#place-${PLACES.both.slug}`)).toBeVisible();
    });

    test('is hidden again after clearing', async () => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /clear/i }).click();
      await expect(filterGroup.getByRole('button', { name: /clear/i })).not.toBeVisible();
    });

    test('place count returns to 3 after clearing', async ({ page }) => {
      await filterGroup.getByRole('button', { name: /food/i }).click();
      await filterGroup.getByRole('button', { name: /clear/i }).click();
      await expect(page.getByText('3 places')).toBeVisible();
    });
  });
});

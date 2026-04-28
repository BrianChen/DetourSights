import { test, expect } from '@playwright/test';
import { DESTINATION } from '../fixtures.js';

const LABEL = DESTINATION.name; // "Test City"

test.describe('Destination gallery', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/${DESTINATION.slug}`);
  });

  test.describe('Thumbnails', () => {
    test('first thumbnail is visible', async ({ page }) => {
      await expect(page.getByAltText(`${LABEL} — photo 1`)).toBeVisible();
    });

    test('shows +N badge on last thumbnail when images exceed thumbnail count', async ({ page }) => {
      // 4 images with default thumbnailCount=3 → "+1" badge
      await expect(page.getByText('+1')).toBeVisible();
    });
  });

  test.describe('Lightbox — open and close', () => {
    test('opens lightbox when first thumbnail is clicked', async ({ page }) => {
      await page.getByAltText(`${LABEL} — photo 1`).click();
      await expect(page.getByText('1 / 4')).toBeVisible();
    });

    test('close button dismisses the lightbox', async ({ page }) => {
      await page.getByAltText(`${LABEL} — photo 1`).click();
      await expect(page.getByText('1 / 4')).toBeVisible();

      await page.getByRole('button', { name: /close/i }).click();
      await expect(page.getByText('1 / 4')).not.toBeVisible();
    });

    test('Escape key closes the lightbox', async ({ page }) => {
      await page.getByAltText(`${LABEL} — photo 1`).click();
      await page.keyboard.press('Escape');
      await expect(page.getByText('1 / 4')).not.toBeVisible();
    });

    test('clicking the backdrop closes the lightbox', async ({ page }) => {
      await page.getByAltText(`${LABEL} — photo 1`).click();
      await expect(page.getByText('1 / 4')).toBeVisible();

      // Click a corner of the viewport outside the image panel
      await page.mouse.click(10, 10);
      await expect(page.getByText('1 / 4')).not.toBeVisible();
    });
  });

  test.describe('Lightbox — navigation', () => {
    test.beforeEach(async ({ page }) => {
      await page.getByAltText(`${LABEL} — photo 1`).click();
      await expect(page.getByText('1 / 4')).toBeVisible();
    });

    test('Previous button is disabled on the first image', async ({ page }) => {
      await expect(page.getByRole('button', { name: /previous/i })).toBeDisabled();
    });

    test('Next button is enabled on the first image', async ({ page }) => {
      await expect(page.getByRole('button', { name: /next/i })).toBeEnabled();
    });

    test('Next button advances to the second image', async ({ page }) => {
      await page.getByRole('button', { name: /next/i }).click();
      await expect(page.getByText('2 / 4')).toBeVisible();
    });

    test('Previous button goes back after advancing', async ({ page }) => {
      await page.getByRole('button', { name: /next/i }).click();
      await page.getByRole('button', { name: /previous/i }).click();
      await expect(page.getByText('1 / 4')).toBeVisible();
    });

    test('ArrowRight navigates to the next image', async ({ page }) => {
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText('2 / 4')).toBeVisible();
    });

    test('ArrowLeft navigates to the previous image', async ({ page }) => {
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowLeft');
      await expect(page.getByText('1 / 4')).toBeVisible();
    });

    test('Next button is disabled on the last image', async ({ page }) => {
      // Advance to last image (index 3 = "4 / 4")
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await page.keyboard.press('ArrowRight');
      await expect(page.getByText('4 / 4')).toBeVisible();
      await expect(page.getByRole('button', { name: /next/i })).toBeDisabled();
    });

    test('clicking second thumbnail opens lightbox at correct index', async ({ page }) => {
      // Close the lightbox opened by beforeEach
      await page.keyboard.press('Escape');

      await page.getByAltText(`${LABEL} — photo 2`).click();
      await expect(page.getByText('2 / 4')).toBeVisible();
    });
  });
});

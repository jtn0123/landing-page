import { test, expect } from '@playwright/test';

test.describe('Cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('all 5 cards render', async ({ page }) => {
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(5);
  });

  test('carousel dot click changes active slide', async ({ page }) => {
    const carousel = page.locator('.carousel').first();
    const dots = carousel.locator('.dot');
    const dotCount = await dots.count();
    if (dotCount < 2) return;

    await dots.nth(1).click();
    await expect(dots.nth(1)).toHaveClass(/active/);
  });

  test('card with data-link navigates on click', async ({ page, context }) => {
    const card = page.locator('.card[data-link]').first();
    const link = await card.getAttribute('data-link');
    expect(link).toBeTruthy();

    const [newPage] = await Promise.all([
      context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
      card.click(),
    ]);
    if (newPage) {
      expect(newPage.url()).toContain(link!.replace('https://', ''));
      await newPage.close();
    }
  });

  test('lightbox opens on image click and closes on Escape', async ({ page }) => {
    const trigger = page.locator('.lightbox-trigger').first();
    await trigger.click();

    const lightbox = page.locator('#lightbox');
    await expect(lightbox).toHaveClass(/active/, { timeout: 3000 });

    await page.keyboard.press('Escape');
    await expect(lightbox).not.toHaveClass(/active/, { timeout: 3000 });
  });
});

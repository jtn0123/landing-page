import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  test('hero section dark theme', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const hero = page.locator('header');
    await expect(hero).toHaveScreenshot('hero-dark.png', { maxDiffPixelRatio: 0.05 });
  });

  test('hero section light theme', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('theme', 'light'));
    await page.reload();
    await page.waitForLoadState('networkidle');

    const hero = page.locator('header');
    await expect(hero).toHaveScreenshot('hero-light.png', { maxDiffPixelRatio: 0.05 });
  });
});

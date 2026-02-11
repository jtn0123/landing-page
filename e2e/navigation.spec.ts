import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('theme toggle changes data-theme attribute', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).not.toHaveAttribute('data-theme', 'light');

    await page.click('#theme-toggle');
    await expect(html).toHaveAttribute('data-theme', 'light');

    await page.click('#theme-toggle');
    await expect(html).not.toHaveAttribute('data-theme', 'light');
  });

  test('hamburger menu opens and closes', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    const overlay = page.locator('#mobile-nav-overlay');

    await expect(overlay).not.toHaveClass(/active/);
    await page.click('#hamburger');
    await expect(overlay).toHaveClass(/active/);
    await page.click('#mobile-nav-close');
    await expect(overlay).not.toHaveClass(/active/);
  });

  test('nav link scrolls to section', async ({ page }) => {
    await page.click('a[href="#tech-section"][data-scroll]');
    await page.waitForTimeout(500);
    const techSection = page.locator('#tech-section');
    await expect(techSection).toBeInViewport();
  });

  test('logo click scrolls to top', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(300);

    await page.click('header h1');
    await page.waitForTimeout(500);
    const scrollY = await page.evaluate(() => window.scrollY);
    expect(scrollY).toBeLessThan(100);
  });
});

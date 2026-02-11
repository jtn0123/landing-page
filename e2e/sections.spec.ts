import { test, expect } from '@playwright/test';

test.describe('Sections', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('stats bar renders numbers', async ({ page }) => {
    const statValues = page.locator('.stat-value');
    const count = await statValues.count();
    expect(count).toBeGreaterThan(0);

    await expect(async () => {
      const texts = await statValues.allTextContents();
      const hasNumber = texts.some((t) => /\d/.test(t));
      expect(hasNumber).toBe(true);
    }).toPass({ timeout: 15000 });
  });

  test('tech grid has items', async ({ page }) => {
    const techItems = page.locator('.tech-item');
    await expect(techItems.first()).toBeVisible({ timeout: 5000 });
    const count = await techItems.count();
    expect(count).toBeGreaterThan(5);
  });

  test('timeline loads commits', async ({ page }) => {
    const timeline = page.locator('#timeline');
    await expect(timeline).toBeVisible();

    await expect(async () => {
      const entries = await timeline.locator('.timeline-entry, .timeline-item, [class*="timeline-"]').count();
      expect(entries).toBeGreaterThan(0);
    }).toPass({ timeout: 20000 });
  });

  test('back-to-top button appears on scroll', async ({ page }) => {
    const btn = page.locator('#back-to-top');
    await expect(btn).not.toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(btn).toBeVisible({ timeout: 3000 });
  });
});

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('main page has no serious a11y violations (dark theme)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.lang-bar') // dynamic content loaded async
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, `A11y violations: ${JSON.stringify(serious, null, 2)}`).toHaveLength(0);
  });

  test('main page has no serious a11y violations (light theme)', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Force dark mode, then toggle to light
    await page.evaluate(() => localStorage.setItem('theme', 'dark'));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.click('#theme-toggle');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.lang-bar')
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(serious, `A11y violations: ${JSON.stringify(serious, null, 2)}`).toHaveLength(0);
  });
});

import { test as base, expect } from '@playwright/test';
import MCR from 'monocart-coverage-reports';

const mcr = MCR({
  name: 'E2E Coverage',
  outputDir: './coverage/e2e',
  sourceFilter: (sourcePath: string) => {
    return sourcePath.includes('src/') && !sourcePath.includes('node_modules');
  },
  reports: ['v8', 'lcovonly'],
});

const test = base.extend({
  page: async ({ page }, use) => {
    await page.coverage.startJSCoverage({ resetOnNavigation: false });
    await use(page);
    try {
      const coverage = await page.coverage.stopJSCoverage();
      await mcr.add(coverage);
    } catch {
      // Page may have closed before coverage could be collected
    }
  },
});

test.afterAll(async () => {
  await mcr.generate();
});

export { test, expect };

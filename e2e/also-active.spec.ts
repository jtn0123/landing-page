import { test, expect } from './fixtures';

const DAY = 24 * 60 * 60 * 1000;

function repoFixture(overrides: Record<string, unknown>) {
  return {
    name: 'example',
    html_url: 'https://github.com/jtn0123/example',
    description: 'An example repo',
    homepage: null,
    language: 'TypeScript',
    stargazers_count: 0,
    forks_count: 0,
    pushed_at: new Date(Date.now() - DAY).toISOString(),
    fork: false,
    archived: false,
    ...overrides,
  };
}

test.describe('Also Active section', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/github/users/jtn0123/repos*', (route) =>
      route.fulfill({
        contentType: 'application/json',
        body: JSON.stringify([
          repoFixture({
            name: 'fresh-repo',
            description: 'A recently pushed project',
            language: 'Python',
            stargazers_count: 2,
          }),
          repoFixture({ name: 'forked-repo', fork: true, language: 'TypeScript' }),
          repoFixture({
            name: 'stale-repo',
            pushed_at: new Date(Date.now() - 120 * DAY).toISOString(),
          }),
          repoFixture({ name: 'Claude-Code-Usage-Monitor' }),
          repoFixture({ name: 'MegaBonk' }),
        ]),
      }),
    );
    await page.goto('/');
  });

  test('shows active repos and hides stale, excluded, and featured ones', async ({ page }) => {
    const section = page.locator('#also-active');
    await expect(section.locator('.repo-mini-card:not(.repo-mini-skeleton)')).toHaveCount(2);

    await expect(section.getByRole('link', { name: 'fresh-repo' })).toBeVisible();
    await expect(section.getByRole('link', { name: 'forked-repo' })).toBeVisible();
    await expect(section.getByText('stale-repo')).toHaveCount(0);
    await expect(section.getByText('Claude-Code-Usage-Monitor')).toHaveCount(0);
    await expect(section.getByText('MegaBonk')).toHaveCount(0);

    await expect(section.getByText('A recently pushed project')).toBeVisible();
  });

  test('marks forks with a badge', async ({ page }) => {
    const forkCard = page.locator('.repo-mini-card', { hasText: 'forked-repo' });
    await expect(forkCard.locator('.repo-mini-fork-badge')).toHaveText('Fork');
    const freshCard = page.locator('.repo-mini-card', { hasText: 'fresh-repo' });
    await expect(freshCard.locator('.repo-mini-fork-badge')).toHaveCount(0);
  });

  test('updates the Projects stat to include discovered repos', async ({ page }) => {
    // 7 featured + 2 discovered
    await expect(page.locator('#total-projects')).toHaveText('9');
  });

  test('tech filter pills apply to mini cards', async ({ page }) => {
    await expect(page.locator('.repo-mini-card:not(.repo-mini-skeleton)')).toHaveCount(2);

    await page.locator('.filter-pill', { hasText: 'Python' }).click();
    await expect(page.locator('.repo-mini-card', { hasText: 'fresh-repo' })).toBeVisible();
    await expect(page.locator('.repo-mini-card', { hasText: 'forked-repo' })).toBeHidden();

    await page.locator('.filter-pill', { hasText: 'All' }).click();
    await expect(page.locator('.repo-mini-card', { hasText: 'forked-repo' })).toBeVisible();
  });

  test('hides the section when the repo listing fails', async ({ page }) => {
    await page.unroute('**/api/github/users/jtn0123/repos*');
    await page.route('**/api/github/users/jtn0123/repos*', (route) =>
      route.fulfill({ status: 500, contentType: 'application/json', body: '{}' }),
    );
    // Fresh page state without the sessionStorage cache from beforeEach's load
    await page.evaluate(() => sessionStorage.clear());
    await page.reload();
    await expect(page.locator('#also-active')).toBeHidden();
  });
});

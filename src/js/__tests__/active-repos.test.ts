import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { UserRepo } from '../types.ts';

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockJson(data: unknown, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
  });
}

const DAY = 24 * 60 * 60 * 1000;

function repo(overrides: Partial<UserRepo>): UserRepo {
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

describe('active-repos', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    sessionStorage.clear();
    document.body.innerHTML = `
      <span id="total-projects">6</span>
      <section id="also-active">
        <div id="also-active-grid">
          <div class="repo-mini-card repo-mini-skeleton" aria-hidden="true"></div>
          <div class="repo-mini-card repo-mini-skeleton" aria-hidden="true"></div>
        </div>
      </section>`;
  });

  describe('selectActiveRepos', () => {
    it('keeps repos pushed within 90 days and drops stale ones', async () => {
      const { selectActiveRepos } = await import('../active-repos.ts');
      const now = Date.now();
      const result = selectActiveRepos(
        [
          repo({ name: 'fresh', pushed_at: new Date(now - 5 * DAY).toISOString() }),
          repo({ name: 'stale', pushed_at: new Date(now - 120 * DAY).toISOString() }),
        ],
        now,
      );
      expect(result.map((r) => r.name)).toEqual(['fresh']);
    });

    it('excludes featured repos and archived repos', async () => {
      const { selectActiveRepos } = await import('../active-repos.ts');
      const result = selectActiveRepos([
        repo({ name: 'MegaBonk' }),
        repo({ name: 'landing-page' }),
        repo({ name: 'archived-one', archived: true }),
        repo({ name: 'compresso' }),
      ]);
      expect(result.map((r) => r.name)).toEqual(['compresso']);
    });

    it('excludes manually blocklisted repos', async () => {
      const { selectActiveRepos } = await import('../active-repos.ts');
      const result = selectActiveRepos([
        repo({ name: 'Claude-Code-Usage-Monitor' }),
        repo({ name: 'RuView' }),
        repo({ name: 'compresso' }),
      ]);
      expect(result.map((r) => r.name)).toEqual(['compresso']);
    });

    it('sorts by most recently pushed first', async () => {
      const { selectActiveRepos } = await import('../active-repos.ts');
      const now = Date.now();
      const result = selectActiveRepos(
        [
          repo({ name: 'older', pushed_at: new Date(now - 10 * DAY).toISOString() }),
          repo({ name: 'newer', pushed_at: new Date(now - 1 * DAY).toISOString() }),
        ],
        now,
      );
      expect(result.map((r) => r.name)).toEqual(['newer', 'older']);
    });
  });

  describe('init', () => {
    it('replaces skeletons with rendered cards', async () => {
      mockFetch.mockImplementation(() =>
        mockJson([
          repo({ name: 'compresso', stargazers_count: 3, homepage: 'https://example.com' }),
          repo({ name: 'WebNeuralNet', fork: true, description: null, language: null }),
        ]),
      );

      const { init } = await import('../active-repos.ts');
      init();
      await new Promise((r) => setTimeout(r, 50));

      const section = document.getElementById('also-active')!;
      expect(section.hidden).toBe(false);
      expect(section.querySelector('.repo-mini-skeleton')).toBeNull();
      const cards = section.querySelectorAll('.repo-mini-card');
      expect(cards.length).toBe(2);
      expect(cards[0].textContent).toContain('compresso');
      expect(cards[0].textContent).toContain('⭐ 3');
      expect(cards[0].querySelector('.repo-mini-link')).not.toBeNull();
      expect((cards[0] as HTMLElement).dataset.lang).toBe('TypeScript');
      expect(cards[1].querySelector('.repo-mini-fork-badge')).not.toBeNull();
      expect(cards[1].textContent).toContain('No description yet.');
      expect((cards[1] as HTMLElement).dataset.lang).toBeUndefined();
    });

    it('updates the total projects stat', async () => {
      mockFetch.mockImplementation(() => mockJson([repo({ name: 'compresso' })]));

      const { init } = await import('../active-repos.ts');
      init();
      await new Promise((r) => setTimeout(r, 50));

      // 6 featured + 1 discovered
      expect(document.getElementById('total-projects')!.textContent).toBe('7');
    });

    it('hides the section when no extra repos are active', async () => {
      mockFetch.mockImplementation(() => mockJson([repo({ name: 'MegaBonk' })]));

      const { init } = await import('../active-repos.ts');
      init();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('also-active')!.hidden).toBe(true);
    });

    it('hides the section when the API fails', async () => {
      mockFetch.mockImplementation(() => mockJson({ message: 'boom' }, 500));

      const { init } = await import('../active-repos.ts');
      init();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.getElementById('also-active')!.hidden).toBe(true);
      expect(document.getElementById('total-projects')!.textContent).toBe('6');
    });

    it('getAllProjectRepoNames merges featured and active repos', async () => {
      mockFetch.mockImplementation(() =>
        mockJson([repo({ name: 'compresso' }), repo({ name: 'MegaBonk' })]),
      );
      const { getAllProjectRepoNames } = await import('../active-repos.ts');
      const names = await getAllProjectRepoNames();
      expect(names).toContain('MegaBonk');
      expect(names).toContain('compresso');
      expect(names.filter((n) => n === 'MegaBonk').length).toBe(1);
    });

    it('getAllProjectRepoNames falls back to featured repos on API failure', async () => {
      mockFetch.mockRejectedValue(new Error('network down'));
      const { getAllProjectRepoNames } = await import('../active-repos.ts');
      const names = await getAllProjectRepoNames();
      expect(names).toEqual([
        'MegaBonk',
        'VoltTracker',
        'landing-page',
        'satellite_processor',
        'AudioWhisper',
        'InkyPi',
      ]);
    });

    it('escapes repo-provided strings', async () => {
      mockFetch.mockImplementation(() =>
        mockJson([repo({ name: 'xss', description: '<img src=x onerror=alert(1)>' })]),
      );

      const { init } = await import('../active-repos.ts');
      init();
      await new Promise((r) => setTimeout(r, 50));

      expect(document.querySelector('#also-active-grid img')).toBeNull();
      expect(document.querySelector('.repo-mini-desc')!.textContent).toContain(
        '<img src=x onerror=alert(1)>',
      );
    });
  });
});

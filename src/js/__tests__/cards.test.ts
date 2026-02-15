import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockIntersectionObserver } from './setup.ts';

// Mock main.ts to prevent side-effect imports
vi.mock('../../main.ts', () => ({
  API_BASE: '/api/github',
  OWNER: 'jtn0123',
  REPOS: ['MegaBonk'],
  CARD_REPOS: ['MegaBonk'],
  reducedMotion: false,
  isMobile: { value: false },
}));

const mockFetch = vi.fn();
globalThis.fetch = mockFetch;

function mockJson(data: any, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
  });
}

describe('cards', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    sessionStorage.clear();
    MockIntersectionObserver.instances.length = 0;
    document.body.innerHTML = `
      <div class="card" data-repo="MegaBonk">
        <h2>MegaBonk<span class="subtitle"></span></h2>
        <div class="card-updated"></div>
      </div>
      <div class="heatmap-row" data-repo="MegaBonk"></div>
      <div class="lang-bar" data-repo="jtn0123/MegaBonk">
        <div class="lang-bar-track shimmer-track"><div class="lang-bar-fill"></div></div>
        <div class="lang-legend"></div>
      </div>`;
  });

  it('renders card meta with stars and forks', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('/repos/jtn0123/MegaBonk') && !url.includes('actions') && !url.includes('stats') && !url.includes('languages')) {
        return mockJson({ pushed_at: new Date().toISOString(), stargazers_count: 5, forks_count: 2 });
      }
      if (url.includes('actions/runs')) return mockJson({ workflow_runs: [{ conclusion: 'success' }] });
      if (url.includes('participation')) return mockJson({ owner: [1, 2, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
      if (url.includes('languages')) return mockJson({ TypeScript: 10000 });
      return mockJson({});
    });

    const { init } = await import('../cards.ts');
    init();
    // Trigger lang bar observer
    MockIntersectionObserver.instances.forEach((obs) => {
      obs.observe.mock.calls.forEach((call: any[]) => {
        obs.trigger([{ isIntersecting: true, target: call[0] }]);
      });
    });
    await new Promise((r) => setTimeout(r, 100));
    const badges = document.querySelector('.card-meta-badges');
    expect(badges).not.toBeNull();
    expect(badges!.textContent).toContain('⭐ 5');
  });

  it('renders CI success badge', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('actions/runs')) return mockJson({ workflow_runs: [{ conclusion: 'success' }] });
      if (url.includes('participation')) return mockJson({ owner: [] });
      if (url.includes('languages')) return mockJson({});
      return mockJson({ pushed_at: null, stargazers_count: 0, forks_count: 0 });
    });
    const { init } = await import('../cards.ts');
    init();
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelector('.ci-badge.ci-success')).not.toBeNull();
  });

  it('renders CI failure badge', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('actions/runs')) return mockJson({ workflow_runs: [{ conclusion: 'failure' }] });
      return mockJson({ pushed_at: null, stargazers_count: 0, forks_count: 0 });
    });
    const { init } = await import('../cards.ts');
    init();
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelector('.ci-badge.ci-failure')).not.toBeNull();
  });

  it('renders heatmap cells', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('participation')) return mockJson({ owner: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12] });
      if (url.includes('actions')) return mockJson({ workflow_runs: [] });
      if (url.includes('languages')) return mockJson({});
      return mockJson({ pushed_at: null, stargazers_count: 0, forks_count: 0 });
    });
    const { init } = await import('../cards.ts');
    init();
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelectorAll('.heatmap-cell').length).toBe(12);
  });

  it('renders lang bar segments', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('languages')) return mockJson({ TypeScript: 50000, Python: 30000, CSS: 20000 });
      if (url.includes('participation')) return mockJson({ owner: [] });
      if (url.includes('actions')) return mockJson({ workflow_runs: [] });
      return mockJson({ pushed_at: null, stargazers_count: 0, forks_count: 0 });
    });
    const { init } = await import('../cards.ts');
    init();
    MockIntersectionObserver.instances.forEach((obs) => {
      obs.observe.mock.calls.forEach((call: any[]) => {
        obs.trigger([{ isIntersecting: true, target: call[0] }]);
      });
    });
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelector('.lang-bar-fill')!.querySelectorAll('span').length).toBeGreaterThan(0);
  });

  it('handles API errors gracefully', async () => {
    mockFetch.mockRejectedValue(new Error('Network error'));
    const { init } = await import('../cards.ts');
    expect(() => init()).not.toThrow();
    await new Promise((r) => setTimeout(r, 100));
  });

  it('skips cards without data-repo', async () => {
    document.body.innerHTML = '<div class="card"><h2>No repo</h2></div>';
    mockFetch.mockImplementation(() => mockJson({}));
    const { init } = await import('../cards.ts');
    init();
    await new Promise((r) => setTimeout(r, 50));
    // No errors
  });

  it('skips CI badge when no workflow runs', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('actions/runs')) return mockJson({ workflow_runs: [] });
      return mockJson({ pushed_at: null, stargazers_count: 0, forks_count: 0 });
    });
    const { init } = await import('../cards.ts');
    init();
    await new Promise((r) => setTimeout(r, 100));
    expect(document.querySelector('.ci-badge')).toBeNull();
  });
});

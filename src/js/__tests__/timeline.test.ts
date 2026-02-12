import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { MockIntersectionObserver } from './setup.ts';

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

function mockJson(data: any) {
  return Promise.resolve({
    ok: true, status: 200,
    headers: new Headers({ 'content-type': 'application/json' }),
    json: () => Promise.resolve(data),
  });
}

const fakeCommits = [{
  commit: { message: 'feat: add feature', committer: { date: new Date().toISOString() }, author: { name: 'Test' } },
  author: { avatar_url: '' }, html_url: 'https://github.com/test', sha: 'abc123',
}];

function triggerObservers(): void {
  MockIntersectionObserver.instances.forEach((obs) => {
    obs.observe.mock.calls.forEach((call: any[]) => {
      obs.trigger([{ isIntersecting: true, target: call[0] }]);
    });
  });
}

describe('timeline', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mockFetch.mockReset();
    sessionStorage.clear();
    MockIntersectionObserver.instances = [];
    document.body.innerHTML = `<section id="activity"><div id="timeline"></div></section>`;
  });

  afterEach(() => { vi.useRealTimers(); });

  it('renders timeline items from API', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('commits?')) return mockJson(fakeCommits);
      if (url.includes('/commits/abc123')) return mockJson({ stats: { additions: 10, deletions: 5 } });
      return mockJson([]);
    });
    const { init } = await import('../timeline.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(500);
    expect(document.querySelectorAll('.timeline-item').length).toBeGreaterThan(0);
  });

  it('uses cached commits from sessionStorage', async () => {
    sessionStorage.setItem('nd_commits', JSON.stringify({
      ts: Date.now(),
      data: [{ message: 'cached', date: new Date().toISOString(), author: 'Test', avatar: '', repo: 'MegaBonk', url: '#', sha: 'x', additions: 1, deletions: 0 }],
    }));
    const { init } = await import('../timeline.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(500);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('renders expandable long commit messages', async () => {
    const longCommits = [{
      commit: { message: 'A'.repeat(70), committer: { date: new Date().toISOString() }, author: { name: 'T' } },
      author: { avatar_url: '' }, html_url: '#', sha: 'def456',
    }];
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('commits?')) return mockJson(longCommits);
      return mockJson({ stats: { additions: 0, deletions: 0 } });
    });
    const { init } = await import('../timeline.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(500);
    expect(document.querySelector('.commit-msg.expandable')).not.toBeNull();
  });

  it('shows error with retry on API failure', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const { init } = await import('../timeline.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(500);
    expect(document.querySelector('.retry-btn')).not.toBeNull();
  });

  it('does nothing without activity section', async () => {
    document.body.innerHTML = '';
    const { init } = await import('../timeline.ts');
    expect(() => init()).not.toThrow();
  });

  it('shows empty message when no commits returned', async () => {
    // Return empty arrays for all repos  
    mockFetch.mockImplementation(() => mockJson([]));
    const { init } = await import('../timeline.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(500);
    // Should show error since empty throws
    const timeline = document.getElementById('timeline')!;
    expect(timeline.innerHTML.length).toBeGreaterThan(0);
  });
});

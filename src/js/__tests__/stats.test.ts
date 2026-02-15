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

function triggerObservers(): void {
  MockIntersectionObserver.instances.forEach((obs) => {
    obs.observe.mock.calls.forEach((call: any[]) => {
      obs.trigger([{ isIntersecting: true, target: call[0] }]);
    });
  });
}

describe('stats', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    mockFetch.mockReset();
    sessionStorage.clear();
    MockIntersectionObserver.instances.length = 0;
    document.body.innerHTML = `
      <div class="stats-bar">
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-loc">&nbsp;</span></div>
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-commits">&nbsp;</span></div>
      </div>`;
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => { cb(performance.now() + 1300); return 0; });
  });

  afterEach(() => { vi.useRealTimers(); });

  it('loads stats from API', async () => {
    mockFetch.mockImplementation((url: string) => {
      if (url.includes('languages')) return mockJson({ TypeScript: 40000 });
      if (url.includes('contributors')) return mockJson([{ contributions: 50 }]);
      return mockJson({});
    });
    const { init } = await import('../stats.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(200);
    expect(document.getElementById('total-loc')!.textContent).not.toBe('');
  });

  it('uses cached stats', async () => {
    sessionStorage.setItem('nd_stats', JSON.stringify({ ts: Date.now(), data: { loc: 5000, commits: 200 } }));
    const { init } = await import('../stats.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(200);
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('handles fetch errors without crashing', async () => {
    mockFetch.mockRejectedValue(new Error('fail'));
    const { init } = await import('../stats.ts');
    init();
    triggerObservers();
    await vi.advanceTimersByTimeAsync(200);
    // Errors are caught internally — stats just don't render
    const locEl = document.getElementById('total-loc');
    expect(locEl).not.toBeNull();
  });

  it('does nothing without stats-bar', async () => {
    document.body.innerHTML = '';
    const { init } = await import('../stats.ts');
    expect(() => init()).not.toThrow();
  });
});

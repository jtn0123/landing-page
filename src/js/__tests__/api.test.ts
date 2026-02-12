import { describe, it, expect, vi, beforeEach } from 'vitest';
import { abbreviateNum, relativeTime, fetchJSON, renderError, parseRateLimit, cachedFetchJSON, animateCounter } from '../api.ts';

describe('abbreviateNum', () => {
  it('returns number as-is below 10000', () => {
    expect(abbreviateNum(500)).toBe('500');
    expect(abbreviateNum(9999)).toBe('9,999');
  });
  it('abbreviates 10k-99k with one decimal', () => {
    expect(abbreviateNum(10000)).toBe('10.0k');
    expect(abbreviateNum(45600)).toBe('45.6k');
  });
  it('abbreviates 100k+ as whole number', () => {
    expect(abbreviateNum(175307)).toBe('175k');
    expect(abbreviateNum(100000)).toBe('100k');
  });
});

describe('relativeTime', () => {
  it('returns "just now" for recent dates', () => {
    const now = new Date().toISOString();
    expect(relativeTime(now)).toBe('just now');
  });
  it('returns minutes ago', () => {
    const fiveMinAgo = new Date(Date.now() - 5 * 60000).toISOString();
    expect(relativeTime(fiveMinAgo)).toBe('5m ago');
  });
  it('returns hours ago', () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 3600000).toISOString();
    expect(relativeTime(twoHoursAgo)).toBe('2h ago');
  });
  it('returns days ago', () => {
    const tenDaysAgo = new Date(Date.now() - 10 * 86400000).toISOString();
    expect(relativeTime(tenDaysAgo)).toBe('10d ago');
  });
  it('returns months ago', () => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000).toISOString();
    expect(relativeTime(sixtyDaysAgo)).toBe('2mo ago');
  });
});

describe('fetchJSON', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
  });

  it('returns parsed JSON on success', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ foo: 'bar' }),
    });
    const result = await fetchJSON('/test');
    expect(result.data).toEqual({ foo: 'bar' });
  });

  it('throws on non-ok response', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 500,
      headers: new Headers({ 'content-type': 'application/json' }),
    });
    await expect(fetchJSON('/test')).rejects.toThrow('API error (500)');
  });

  it('throws on non-JSON content type', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'text/html' }),
      json: () => Promise.resolve({}),
    });
    await expect(fetchJSON('/test')).rejects.toThrow('Non-JSON response');
  });

  it('throws rate limit message on 403 with rate limit headers', async () => {
    const resetTime = Math.floor(Date.now() / 1000) + 120;
    mockFetch.mockResolvedValue({
      ok: false, status: 403,
      headers: new Headers({
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': String(resetTime),
      }),
    });
    await expect(fetchJSON('/test')).rejects.toThrow('Rate limited');
  });

  it('throws generic error on 429 without rate limit headers', async () => {
    mockFetch.mockResolvedValue({
      ok: false, status: 429,
      headers: new Headers({}),
    });
    await expect(fetchJSON('/test')).rejects.toThrow('API error (429)');
  });
});

describe('parseRateLimit', () => {
  it('returns null when no rate limit headers', () => {
    const res = new Response('', { headers: {} });
    expect(parseRateLimit(res)).toBeNull();
  });

  it('returns null when remaining > 0', () => {
    const res = new Response('', { headers: { 'X-RateLimit-Remaining': '5', 'X-RateLimit-Reset': '123' } });
    expect(parseRateLimit(res)).toBeNull();
  });

  it('returns message when remaining is 0', () => {
    const resetTime = Math.floor(Date.now() / 1000) + 120;
    const res = new Response('', { headers: { 'X-RateLimit-Remaining': '0', 'X-RateLimit-Reset': String(resetTime) } });
    const msg = parseRateLimit(res);
    expect(msg).toContain('Rate limited');
  });
});

describe('renderError', () => {
  it('renders error message with retry button', () => {
    const container = document.createElement('div');
    const retryFn = vi.fn();
    renderError(container, 'Something failed', retryFn);
    expect(container.querySelector('.error-icon')!.textContent).toBe('⚠️');
    expect(container.querySelector('p')!.textContent).toBe('Something failed');
    const btn = container.querySelector('.retry-btn') as HTMLButtonElement;
    btn.click();
    expect(retryFn).toHaveBeenCalled();
    expect(btn.disabled).toBe(true);
  });

  it('escapes HTML in error message', () => {
    const container = document.createElement('div');
    renderError(container, '<script>alert("xss")</script>', vi.fn());
    expect(container.querySelector('p')!.textContent).toContain('<script>');
    expect(container.innerHTML).not.toContain('<script>alert');
  });
});

describe('cachedFetchJSON', () => {
  const mockFetch = vi.fn();
  beforeEach(() => {
    globalThis.fetch = mockFetch;
    mockFetch.mockReset();
    sessionStorage.clear();
  });

  it('returns cached data when available', async () => {
    sessionStorage.setItem('nd_api_/test', JSON.stringify({ ts: Date.now(), data: { cached: true } }));
    const result = await cachedFetchJSON('/test');
    expect(result.data).toEqual({ cached: true });
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('fetches and caches when no cache', async () => {
    mockFetch.mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ fresh: true }),
    });
    const result = await cachedFetchJSON('/test2');
    expect(result.data).toEqual({ fresh: true });
    expect(sessionStorage.getItem('nd_api_/test2')).not.toBeNull();
  });

  it('refetches when cache is expired', async () => {
    sessionStorage.setItem('nd_api_/test3', JSON.stringify({ ts: Date.now() - 9999999, data: { old: true } }));
    mockFetch.mockResolvedValue({
      ok: true, status: 200,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ new: true }),
    });
    const result = await cachedFetchJSON('/test3');
    expect(result.data).toEqual({ new: true });
  });
});

describe('animateCounter', () => {
  it('animates to target value', () => {
    vi.useFakeTimers();
    const el = document.createElement('span');
    el.classList.add('shimmer-placeholder');
    vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation((cb) => { cb(performance.now() + 1300); return 0; });
    animateCounter(el, 100);
    expect(el.classList.contains('shimmer-placeholder')).toBe(false);
    expect(el.textContent).toBe('100');
    vi.useRealTimers();
  });
});

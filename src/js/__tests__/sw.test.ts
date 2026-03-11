import { beforeEach, describe, expect, it, vi } from 'vitest';

type CacheStore = {
  addAll: ReturnType<typeof vi.fn>;
  match: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

type FetchEventLike = {
  request: Request;
  respondWith: ReturnType<typeof vi.fn>;
  waitUntil: ReturnType<typeof vi.fn>;
};

describe('service worker', () => {
  const listeners = new Map<string, EventListener>();
  let fetchMock: ReturnType<typeof vi.fn>;
  let staticCache: CacheStore;
  let apiCache: CacheStore;

  beforeEach(async () => {
    vi.resetModules();
    listeners.clear();
    fetchMock = vi.fn();
    staticCache = {
      addAll: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };
    apiCache = {
      addAll: vi.fn().mockResolvedValue(undefined),
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };

    Object.defineProperty(globalThis, 'fetch', {
      configurable: true,
      value: fetchMock,
    });
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: { origin: 'https://neuhard.dev' },
    });
    Object.defineProperty(globalThis, 'skipWaiting', {
      configurable: true,
      value: vi.fn(),
    });
    Object.defineProperty(globalThis, 'clients', {
      configurable: true,
      value: { claim: vi.fn() },
    });
    Object.defineProperty(globalThis, 'addEventListener', {
      configurable: true,
      value: (type: string, listener: EventListener) => {
        listeners.set(type, listener);
      },
    });
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: {
        open: vi.fn(async (name: string) => (name.includes('api') ? apiCache : staticCache)),
        keys: vi.fn().mockResolvedValue(['neuhard-static-v1', 'neuhard-api-v1']),
        delete: vi.fn().mockResolvedValue(true),
      },
    });

    // @ts-expect-error service worker file is plain JS without TS declarations
    await import('../../public/sw.js');
  });

  it('uses network-first for navigations and updates the cache', async () => {
    fetchMock.mockResolvedValue(
      new Response('<html>fresh</html>', {
        status: 200,
        headers: { 'content-type': 'text/html' },
      }),
    );

    const respondWith = vi.fn();
    const waitUntil = vi.fn();
    const event: FetchEventLike = {
      request: new Request('https://neuhard.dev/', {
        headers: { accept: 'text/html' },
      }),
      respondWith,
      waitUntil,
    };

    listeners.get('fetch')?.(event as unknown as Event);
    const response = await respondWith.mock.calls[0][0];

    expect(await response.text()).toContain('fresh');
    expect(staticCache.put).toHaveBeenCalledTimes(1);
    expect(waitUntil).toHaveBeenCalledTimes(1);
  });

  it('keeps stale API cache as offline fallback instead of deleting it', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    apiCache.match.mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'sw-cache-time': String(Date.now() - 31 * 60 * 1000),
        },
      }),
    );

    const respondWith = vi.fn();
    const waitUntil = vi.fn();
    const event: FetchEventLike = {
      request: new Request('https://neuhard.dev/api/github/repos/jtn0123/InkyPi/languages'),
      respondWith,
      waitUntil,
    };

    listeners.get('fetch')?.(event as unknown as Event);
    const response = await respondWith.mock.calls[0][0];

    expect(response.status).toBe(200);
    expect(waitUntil).not.toHaveBeenCalled();
  });
});

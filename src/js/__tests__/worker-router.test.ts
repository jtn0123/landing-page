import { beforeEach, describe, expect, it, vi } from 'vitest';

type CacheLike = {
  match: ReturnType<typeof vi.fn>;
  put: ReturnType<typeof vi.fn>;
};

type WorkerModule = {
  default: {
    fetch(
      request: Request,
      env: { GITHUB_TOKEN?: string },
      ctx: { waitUntil(promise: Promise<unknown>): void },
    ): Promise<Response>;
  };
};

const fetchMock = vi.fn<typeof fetch>();
globalThis.fetch = fetchMock;

describe('worker router', () => {
  let cache: CacheLike;
  let waitUntilCalls: number;

  async function loadRouter(): Promise<WorkerModule['default']> {
    // @ts-expect-error worker runtime is plain JS and intentionally has no TS declarations
    const mod = (await import('../../../worker/router.js')) as WorkerModule;
    return mod.default;
  }

  beforeEach(() => {
    vi.resetModules();
    fetchMock.mockReset();
    waitUntilCalls = 0;
    cache = {
      match: vi.fn().mockResolvedValue(undefined),
      put: vi.fn().mockResolvedValue(undefined),
    };
    Object.defineProperty(globalThis, 'caches', {
      configurable: true,
      value: { default: cache },
    });
  });

  it('proxies InkyPi GitHub requests', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ Python: 1234 }), {
        status: 200,
        headers: {
          'content-type': 'application/json',
          'x-ratelimit-remaining': '42',
          'x-ratelimit-reset': '0',
        },
      }),
    );

    const ctx = {
      waitUntil() {
        waitUntilCalls += 1;
      },
    };

    const router = await loadRouter();
    const response = await router.fetch(
      new Request('https://neuhard.dev/api/github/repos/jtn0123/InkyPi/languages'),
      {},
      ctx,
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.github.com/repos/jtn0123/InkyPi/languages',
      expect.objectContaining({
        headers: expect.objectContaining({
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'neuhard-dev-worker',
        }),
      }),
    );
    expect(waitUntilCalls).toBe(1);
  });

  it('rejects repos outside the allowlist', async () => {
    const ctx = {
      waitUntil() {
        waitUntilCalls += 1;
      },
    };

    const router = await loadRouter();
    const response = await router.fetch(
      new Request('https://neuhard.dev/api/github/repos/jtn0123/not-real/languages'),
      {},
      ctx,
    );

    expect(response.status).toBe(404);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('accepts referers from the www hostname when origin is absent', async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ Python: 1234 }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );

    const router = await loadRouter();
    const response = await router.fetch(
      new Request('https://neuhard.dev/api/github/repos/jtn0123/InkyPi/languages', {
        headers: { Referer: 'https://www.neuhard.dev/projects' },
      }),
      {},
      { waitUntil() {} },
    );

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});

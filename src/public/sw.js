const STATIC_CACHE = 'neuhard-static-v2';
const API_CACHE = 'neuhard-api-v2';
const ACTIVE_CACHES = [STATIC_CACHE, API_CACHE];
const SHELL_ASSETS = ['/', '/index.html'];
const API_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => !ACTIVE_CACHES.includes(k)).map((k) => caches.delete(k))
      ),
    ).then(() => globalThis.clients.claim())
  );
});

globalThis.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  const isSameOrigin = url.origin === globalThis.location.origin;
  const isNavigation =
    request.mode === 'navigate' ||
    request.destination === 'document' ||
    request.headers.get('accept')?.includes('text/html');

  // Network-first for API calls with TTL expiry on cached responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (request.method === 'GET' && response.ok) {
            const clone = response.clone();
            const headers = new Headers(clone.headers);
            headers.set('sw-cache-time', String(Date.now()));
            const cachedResponse = new Response(clone.body, {
              status: clone.status,
              statusText: clone.statusText,
              headers,
            });
            const cacheWrite = caches.open(API_CACHE).then((cache) => cache.put(request, cachedResponse));
            event.waitUntil(cacheWrite);
          }
          return response;
        })
        .catch(() =>
          caches.open(API_CACHE).then((cache) => cache.match(request)).then((cached) => {
            if (!cached) return new Response('Service Unavailable', { status: 503 });
            const cacheTime = Number(cached.headers.get('sw-cache-time') || '0');
            const isExpired = cacheTime && Date.now() - cacheTime > API_CACHE_TTL;
            if (isExpired) {
              // Keep stale cached data as an offline fallback instead of deleting it.
            }
            return cached;
          })
        )
    );
    return;
  }

  // Network-first for navigations so deploys become visible immediately.
  if (isNavigation && isSameOrigin) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            event.waitUntil(caches.open(STATIC_CACHE).then((cache) => cache.put(request, clone)));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(STATIC_CACHE);
          return (
            (await cache.match(request)) ||
            (await cache.match('/')) ||
            new Response('Offline', { status: 503 })
          );
        }),
    );
    return;
  }

  // Cache-first for same-origin static assets
  event.respondWith(
    caches.open(STATIC_CACHE).then((cache) => cache.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && isSameOrigin) {
          const clone = response.clone();
          event.waitUntil(cache.put(request, clone));
        }
        return response;
      });
    }))
  );
});

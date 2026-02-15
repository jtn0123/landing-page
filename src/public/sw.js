const CACHE_NAME = 'neuhard-v1';
const SHELL_ASSETS = [
  '/',
  '/index.html',
];
const API_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

globalThis.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .then(() => globalThis.skipWaiting())
  );
});

globalThis.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  );
  globalThis.clients.claim();
});

globalThis.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Network-first for API calls with TTL expiry on cached responses
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const clone = response.clone();
            const headers = new Headers(clone.headers);
            headers.set('sw-cache-time', String(Date.now()));
            const cachedResponse = new Response(clone.body, {
              status: clone.status,
              statusText: clone.statusText,
              headers,
            });
            const cacheWrite = caches.open(CACHE_NAME).then((cache) => cache.put(request, cachedResponse));
            event.waitUntil(cacheWrite);
          }
          return response;
        })
        .catch(() =>
          caches.match(request).then((cached) => {
            if (!cached) return new Response('Service Unavailable', { status: 503 });
            const cacheTime = Number(cached.headers.get('sw-cache-time') || '0');
            if (cacheTime && Date.now() - cacheTime > API_CACHE_TTL) {
              // Cached response is stale — delete it but still return it as fallback
              event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.delete(request)));
            }
            return cached;
          })
        )
    );
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok && url.origin === globalThis.location.origin) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});

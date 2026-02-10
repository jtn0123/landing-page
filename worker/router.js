/**
 * Cloudflare Worker — neuhard.dev router
 *
 * Routes requests to the appropriate Pages project based on path prefix.
 * Also proxies GitHub API requests with caching.
 */

// Map path prefixes → Pages project origins
const ROUTES = {
  '/megabonk/':    'https://megabonk.pages.dev',
  '/volttracker/': 'https://volttracker.neuhard.dev',
};

// Landing page fallback
const LANDING = 'https://landing-page-28t.pages.dev';

const GITHUB_API = 'https://api.github.com';
const GITHUB_CACHE_TTL = 300; // 5 minutes

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // GitHub API proxy
    if (path.startsWith('/api/github/')) {
      return handleGitHubProxy(request, url, ctx, env);
    }

    for (const [prefix, origin] of Object.entries(ROUTES)) {
      if (path.startsWith(prefix)) {
        const subPath = path.slice(prefix.length - 1);
        const target = new URL(subPath + url.search, origin);
        return fetch(new Request(target, request));
      }
    }

    // Everything else → landing page
    const target = new URL(path + url.search, LANDING);
    return fetch(new Request(target, request));
  },
};

async function handleGitHubProxy(request, url, ctx, env) {
  const ghPath = url.pathname.replace('/api/github/', '/');
  const ghUrl = GITHUB_API + ghPath + url.search;

  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Check Cloudflare cache
  const cacheKey = new Request(url.toString(), request);
  const cache = caches.default;
  let response = await cache.match(cacheKey);

  if (response) {
    return response;
  }

  // Fetch from GitHub
  const ghResponse = await fetch(ghUrl, {
    headers: {
      'User-Agent': 'neuhard-dev-worker',
      'Accept': 'application/vnd.github.v3+json',
      ...(env.GITHUB_TOKEN ? { 'Authorization': `Bearer ${env.GITHUB_TOKEN}` } : {}),
    },
  });

  // Build response with cache headers
  const body = await ghResponse.arrayBuffer();
  response = new Response(body, {
    status: ghResponse.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': `public, max-age=${GITHUB_CACHE_TTL}`,
      ...corsHeaders,
      'X-RateLimit-Remaining': ghResponse.headers.get('X-RateLimit-Remaining') || '',
      'X-RateLimit-Reset': ghResponse.headers.get('X-RateLimit-Reset') || '',
    },
  });

  // Only cache successful responses
  if (ghResponse.status === 200) {
    ctx.waitUntil(cache.put(cacheKey, response.clone()));
  }

  return response;
}

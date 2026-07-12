/**
 * Cloudflare Worker — neuhard.dev router
 *
 * Routes requests to the appropriate Pages project based on path prefix.
 * Also proxies GitHub API requests with caching, origin restriction, and path allowlisting.
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

// --- Security: allowed origins for GitHub API proxy ---
const ALLOWED_ORIGINS = new Set([
  'https://neuhard.dev',
  'https://www.neuhard.dev',
]);

// --- Security: allowed GitHub API path patterns ---
// Owner-scoped: only this account's public repo listing and the specific
// per-repo endpoints the landing page uses. Repo names are dynamic because
// the "Also Active" section, stats, and timeline auto-discover active repos.
const OWNER = 'jtn0123';
const REPO_NAME = '[A-Za-z0-9._-]+';

const ALLOWED_PATH_RES = [
  // Public repo listing powers the "Also Active" section on the landing page.
  new RegExp(`^/users/${OWNER}/repos$`),
  new RegExp(`^/repos/${OWNER}/${REPO_NAME}$`),
  new RegExp(`^/repos/${OWNER}/${REPO_NAME}/(languages|contributors|commits|stats/participation|actions/runs)$`),
  // Commit detail: /repos/{owner}/{repo}/commits/{sha}
  new RegExp(`^/repos/${OWNER}/${REPO_NAME}/commits/[0-9a-f]{7,40}$`),
];

function isAllowedGitHubPath(path) {
  return ALLOWED_PATH_RES.some((re) => re.test(path));
}

// --- Security headers applied to all responses ---
const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
};

function addSecurityHeaders(response) {
  const newResponse = new Response(response.body, response);
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    newResponse.headers.set(key, value);
  }
  return newResponse;
}

function getOrigin(value) {
  if (!value) return '';
  try {
    return new URL(value).origin;
  } catch {
    return '';
  }
}

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
        const resp = await fetch(new Request(target, request));
        return addSecurityHeaders(resp);
      }
    }

    // Everything else → landing page
    const target = new URL(path + url.search, LANDING);
    const resp = await fetch(new Request(target, request));
    return addSecurityHeaders(resp);
  },
};

async function handleGitHubProxy(request, url, ctx, env) {
  const origin = request.headers.get('Origin') || '';
  const referer = request.headers.get('Referer') || '';

  // --- Origin check ---
  // Allow requests with no Origin (direct/server-side), but block wrong origins
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return new Response('Forbidden', { status: 403 });
  }

  // Defense in depth: also check Referer if present
  if (!origin && referer && !ALLOWED_ORIGINS.has(getOrigin(referer))) {
    return new Response('Forbidden', { status: 403 });
  }

  const corsOrigin = ALLOWED_ORIGINS.has(origin) ? origin : 'https://neuhard.dev';
  const corsHeaders = {
    'Access-Control-Allow-Origin': corsOrigin,
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Vary': 'Origin',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  // Only allow GET
  if (request.method !== 'GET') {
    return new Response('Method not allowed', { status: 405 });
  }

  // --- Path allowlist ---
  const ghPath = url.pathname.replace('/api/github/', '/');
  if (!isAllowedGitHubPath(ghPath)) {
    return new Response('Not found', { status: 404 });
  }

  const ghUrl = GITHUB_API + ghPath + url.search;

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
      ...SECURITY_HEADERS,
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

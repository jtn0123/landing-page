/**
 * Cloudflare Worker — neuhard.dev router
 *
 * Routes requests to the appropriate Pages project based on path prefix.
 *
 * Setup:
 *   1. Deploy each sub-project as its own Cloudflare Pages project:
 *      - "neuhard-dev"   → landing page (this repo's dist/)
 *      - "megabonk"      → MegaBonk guide
 *      - "volttracker"   → VoltTracker dashboard (when ready)
 *
 *   2. Create a Cloudflare Worker (e.g. "neuhard-dev-router") and paste this script.
 *
 *   3. Add a custom domain route: neuhard.dev/* → neuhard-dev-router
 *
 *   4. Update the Pages project hostnames below to match your actual
 *      *.pages.dev subdomains (or use Service Bindings for zero-latency).
 *
 * Alternative (Service Bindings):
 *   Instead of fetch-to-pages-url, you can bind each Pages project as a
 *   Service Binding in wrangler.toml and call env.MEGABONK.fetch(req), etc.
 *   This avoids an extra DNS hop and is the recommended production approach.
 */

// Map path prefixes → Pages project origins
const ROUTES = {
  '/megabonk/':    'https://megabonk.pages.dev',
  '/volttracker/': 'https://volttracker.neuhard.dev',
};

// Landing page fallback
const LANDING = 'https://landing-page-28t.pages.dev';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    for (const [prefix, origin] of Object.entries(ROUTES)) {
      if (path.startsWith(prefix)) {
        // Strip the prefix so the Pages project sees its own root-relative paths
        const subPath = path.slice(prefix.length - 1); // keep leading /
        const target = new URL(subPath + url.search, origin);
        return fetch(new Request(target, request));
      }
    }

    // Everything else → landing page
    const target = new URL(path + url.search, LANDING);
    return fetch(new Request(target, request));
  },
};

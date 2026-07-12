# CLAUDE.md

neuhard.dev — portfolio landing page. Vanilla TypeScript + Vite, no framework.

## Commands

- `npm run dev` — dev server on :5173 (proxies `/api/github` → api.github.com; production uses the Cloudflare Worker instead)
- `npm test` — Vitest unit tests
- `npm run type-check` / `npm run lint` / `npm run format`
- `npm run build` then `bash scripts/check-bundle-size.sh` — budgets: 50 kB JS / 20 kB CSS gzipped
- `npx playwright test --project=chromium` — e2e against a preview build (CI runs chromium only)

## Architecture

- `src/js/*.ts` — one module per feature, each exporting `init()`; wired in `src/main.ts` (below-fold modules lazy-load)
- `src/js/constants.ts` — `REPOS` is the featured-project list; the "Also Active" section (`active-repos.ts`) auto-discovers any repo pushed in the last 90 days that isn't featured (blocklist: `EXCLUDED_REPOS`). Stats and timeline aggregate over featured + discovered via `getAllProjectRepoNames()`
- `worker/router.js` — Cloudflare Worker: routes subdomains/paths and proxies the GitHub API (owner-scoped allowlist). Auto-deploys via `deploy-worker.yml` when `worker/**` changes on master
- Site deploys via Cloudflare Pages on master push

## Conventions

- Bump the footer version in `src/index.html` (e.g. v4.11.0) on any user-visible change — it's how deploys are verified
- Adding a featured card: update `REPOS`/`CARD_REPOS`, `HEATMAP_COLORS` in cards.ts, the card in index.html, the static `#total-projects` count, JSON-LD, and the count assertions in `e2e/cards.spec.ts` + `e2e/also-active.spec.ts` + active-repos unit tests
- Visual snapshots (`e2e/visual.spec.ts-snapshots/`) are Linux-only; local macOS runs generate `*darwin*` files that must not be committed
- CI runs on GitHub-hosted runners; the sonar job uploads to SonarCloud and is informational (`continue-on-error`)
- Service worker registers in production builds only — never re-enable it in dev (it caches unhashed source modules)

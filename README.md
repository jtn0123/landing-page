# neuhard.dev

> Personal portfolio & project dashboard — live at [neuhard.dev](https://neuhard.dev)

A responsive, accessible portfolio site showcasing full-stack engineering projects. Features live GitHub data, contribution heatmaps, animated timelines, theme switching, and a Cloudflare Worker API proxy.

![TypeScript](https://img.shields.io/badge/TypeScript-3178c6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646cff?logo=vite&logoColor=white)
![Cloudflare Pages](https://img.shields.io/badge/Cloudflare%20Pages-f38020?logo=cloudflare&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2ead33?logo=playwright&logoColor=white)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Language** | TypeScript (strict) |
| **Bundler** | Vite 6 |
| **Hosting** | Cloudflare Pages |
| **API Proxy** | Cloudflare Worker (cached GitHub API) |
| **Testing** | Vitest (unit) · Playwright (e2e) · axe-core (a11y) |
| **CI** | GitHub Actions |
| **Linting** | ESLint · Prettier |

## Architecture

```text
src/
├── main.ts              # Entry point — module init orchestration
├── index.html           # Single-page HTML with inline critical CSS
├── style.css            # Global styles
├── css/                 # 11 component stylesheets
│   ├── cards.css
│   ├── carousel.css
│   ├── header.css
│   ├── lightbox.css
│   ├── progress-dots.css
│   ├── reset.css
│   ├── stats.css
│   ├── tech-grid.css
│   ├── timeline.css
│   ├── utilities.css
│   └── wave.css
├── js/                  # 12 TypeScript modules
│   ├── api.ts           # Fetch utilities, caching, error rendering
│   ├── cards.ts         # Project card data loading & rendering
│   ├── carousel.ts      # Image carousel with swipe support
│   ├── config.ts        # Shared runtime config (isMobile, reducedMotion)
│   ├── filter.ts        # Technology filter pills
│   ├── lightbox.ts      # Image lightbox dialog with pinch-zoom
│   ├── nav.ts           # Navigation, hamburger menu, smooth scroll
│   ├── parallax.ts      # Card tilt & background parallax
│   ├── scroll.ts        # Scroll progress, back-to-top, fade-in
│   ├── stats.ts         # Aggregate stats (LOC, commits)
│   ├── timeline.ts      # Recent activity timeline
│   └── types.ts         # Shared TypeScript interfaces
├── images/              # Optimized WebP + PNG project screenshots
└── public/
    ├── sw.js            # Service worker (cache-first static, network-first API)
    ├── robots.txt
    └── sitemap.xml

worker/                  # Cloudflare Worker — GitHub API proxy with 30-min cache
e2e/                     # Playwright end-to-end tests
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+

### Setup

```bash
git clone https://github.com/jtn0123/landing-page.git
cd landing-page
npm ci
```

### Development

```bash
npm run dev          # Start Vite dev server (http://localhost:5173)
```

### Build & Preview

```bash
npm run build        # Production build to dist/
npm run preview      # Preview production build (http://localhost:4173)
```

## Testing

```bash
npm test             # Run unit tests (Vitest)
npm run test:coverage # Unit tests with coverage report
npm run test:e2e     # End-to-end tests (Playwright)
```

### Linting & Type Checking

```bash
npm run lint         # ESLint
npm run type-check   # TypeScript strict mode check
npm run format:check # Prettier format check
```

## Deployment

The site deploys automatically to **Cloudflare Pages** on push to `master`.

- **Static site** → Cloudflare Pages (Vite build output)
- **API proxy** → Cloudflare Worker at `/api/github/*` (caches GitHub API responses for 30 minutes)
- **CI** → GitHub Actions runs lint, type-check, unit tests, e2e tests, bundle size check, and Lighthouse audits

## Screenshots

<!-- Add screenshots here -->
<!-- ![Dark theme](docs/screenshot-dark.png) -->
<!-- ![Light theme](docs/screenshot-light.png) -->

## License

Private project — all rights reserved.

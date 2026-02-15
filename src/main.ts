import './style.css';

// --- Shared constants (re-exported from constants.ts to avoid circular deps) ---
export { API_BASE, REPOS, CARD_REPOS, OWNER } from './js/constants.ts';

// Re-export from config for backward compat
export { reducedMotion, isMobile } from './js/config.ts';

// --- Module imports ---
import { init as initTheme } from './js/theme.ts';
import { init as initNav } from './js/nav.ts';
import { init as initCarousel } from './js/carousel.ts';
import { init as initLightbox } from './js/lightbox.ts';
import { init as initParallax } from './js/parallax.ts';
import { init as initCards } from './js/cards.ts';
import { init as initScroll } from './js/scroll.ts';
import { init as initFilter } from './js/filter.ts';

// --- Initialize above-fold modules ---
initTheme();
initNav();
initCarousel();
initLightbox();
initParallax();
initCards();
initScroll();
initFilter();

// --- Lazy-load below-fold modules ---
try {
  const [stats, timeline] = await Promise.all([
    import('./js/stats.ts'),
    import('./js/timeline.ts'),
  ]);
  stats.init();
  timeline.init();
} catch (e) {
  console.warn('Failed to load below-fold modules', e);
}

// --- Register service worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

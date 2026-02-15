import './style.css';

// --- Shared constants ---
export const API_BASE: string = '/api/github';
export const REPOS: string[] = [
  'MegaBonk',
  'VoltTracker',
  'landing-page',
  'satellite_processor',
  'AudioWhisper',
];
export const CARD_REPOS: string[] = [
  'MegaBonk',
  'VoltTracker',
  'satellite_processor',
  'AudioWhisper',
];
export const OWNER: string = 'jtn0123';

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

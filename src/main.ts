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
export const reducedMotion: boolean = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const mobileQuery = window.matchMedia('(max-width: 720px)');
export const isMobile: { value: boolean } = { value: mobileQuery.matches };
mobileQuery.addEventListener('change', (e) => {
  isMobile.value = e.matches;
});

// --- Module imports ---
import { init as initTheme } from './js/theme.ts';
import { init as initNav } from './js/nav.ts';
import { init as initCarousel } from './js/carousel.ts';
import { init as initLightbox } from './js/lightbox.ts';
import { init as initParallax } from './js/parallax.ts';
import { init as initCards } from './js/cards.ts';
import { init as initStats } from './js/stats.ts';
import { init as initTimeline } from './js/timeline.ts';
import { init as initScroll } from './js/scroll.ts';
import { init as initFilter } from './js/filter.ts';

// --- Initialize all modules ---
initTheme();
initNav();
initCarousel();
initLightbox();
initParallax();
initCards();
initStats();
initTimeline();
initScroll();
initFilter();

// --- Register service worker ---
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}

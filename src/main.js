// --- Shared constants ---
export const API_BASE = '/api/github';
export const REPOS = ['MegaBonk', 'VoltTracker', 'landing-page', 'satellite_processor', 'AudioWhisper'];
export const CARD_REPOS = ['MegaBonk', 'VoltTracker', 'satellite_processor', 'AudioWhisper'];
export const OWNER = 'jtn0123';
export const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const isMobile = window.matchMedia('(max-width: 720px)').matches;

// --- Module imports ---
import { init as initTheme } from './js/theme.js';
import { init as initNav } from './js/nav.js';
import { init as initCarousel } from './js/carousel.js';
import { init as initLightbox } from './js/lightbox.js';
import { init as initParallax } from './js/parallax.js';
import { init as initCards } from './js/cards.js';
import { init as initStats } from './js/stats.js';
import { init as initTimeline } from './js/timeline.js';
import { init as initScroll } from './js/scroll.js';

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

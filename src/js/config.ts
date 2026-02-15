/**
 * Shared runtime configuration — media queries and device detection.
 * @module config
 */

/** Whether the user prefers reduced motion. */
export const reducedMotion: boolean = globalThis.matchMedia(
  '(prefers-reduced-motion: reduce)',
).matches;

const mobileQuery = globalThis.matchMedia('(max-width: 720px)');

/** Reactive mobile breakpoint flag. Updated automatically on viewport changes. */
export const isMobile: { value: boolean } = { value: mobileQuery.matches };

mobileQuery.addEventListener('change', (e) => {
  isMobile.value = e.matches;
});

/**
 * Image carousel with auto-advance, dot navigation, swipe, and Ken Burns effect.
 * @module carousel
 */
import { reducedMotion } from './config.ts';

/** Initialize all carousels on the page. */
export function init(): void {
  document.querySelectorAll('.carousel').forEach((carousel) => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.dot');
    if (slides.length < 2) return;

    let current = 0;
    let paused = false;
    const interval = Number.parseInt((carousel as HTMLElement).dataset.interval || '4000') || 4000;

    function applyKenBurns(idx: number): void {
      if (reducedMotion) return;
      slides.forEach((s) => s.classList.remove('kb-zoom'));
      slides[idx].classList.add('kb-zoom');
    }

    function goTo(idx: number): void {
      slides[current].classList.remove('active', 'kb-zoom');
      dots[current].classList.remove('active');
      current = ((idx % slides.length) + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      applyKenBurns(current);
    }

    applyKenBurns(0);

    carousel.addEventListener('mouseenter', () => (paused = true));
    carousel.addEventListener('mouseleave', () => (paused = false));

    dots.forEach((dot, i) => {
      dot.addEventListener('click', (e: Event) => {
        e.stopPropagation();
        goTo(i);
      });
    });

    if (!reducedMotion) {
      setInterval(() => {
        if (!paused) goTo(current + 1);
      }, interval);
    }

    // Swipe support
    let touchStartX = 0,
      touchStartY = 0,
      swiping = false;
    carousel.addEventListener(
      'touchstart',
      (e: Event) => {
        const te = e as TouchEvent;
        touchStartX = te.touches[0].clientX;
        touchStartY = te.touches[0].clientY;
        swiping = true;
      },
      { passive: true },
    );
    carousel.addEventListener(
      'touchmove',
      (e: Event) => {
        if (!swiping) return;
        const te = e as TouchEvent;
        const dy = Math.abs(te.touches[0].clientY - touchStartY);
        const dx = Math.abs(te.touches[0].clientX - touchStartX);
        if (dy > dx) swiping = false;
      },
      { passive: true },
    );
    carousel.addEventListener(
      'touchend',
      (e: Event) => {
        if (!swiping) return;
        const te = e as TouchEvent;
        const diff = te.changedTouches[0].clientX - touchStartX;
        if (Math.abs(diff) > 50) {
          goTo(diff < 0 ? current + 1 : current - 1);
        }
        swiping = false;
      },
      { passive: true },
    );
  });
}

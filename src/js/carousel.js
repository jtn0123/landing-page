import { reducedMotion } from '../main.js';

export function init() {
  document.querySelectorAll('.carousel').forEach(carousel => {
    const slides = carousel.querySelectorAll('.carousel-slide');
    const dots = carousel.querySelectorAll('.dot');
    if (slides.length < 2) return;

    let current = 0;
    let paused = false;
    const interval = parseInt(carousel.dataset.interval) || 4000;

    function applyKenBurns(idx) {
      if (reducedMotion) return;
      slides.forEach(s => s.classList.remove('kb-zoom'));
      slides[idx].classList.add('kb-zoom');
    }

    function goTo(idx) {
      slides[current].classList.remove('active', 'kb-zoom');
      dots[current].classList.remove('active');
      current = ((idx % slides.length) + slides.length) % slides.length;
      slides[current].classList.add('active');
      dots[current].classList.add('active');
      applyKenBurns(current);
    }

    applyKenBurns(0);

    carousel.addEventListener('mouseenter', () => paused = true);
    carousel.addEventListener('mouseleave', () => paused = false);

    dots.forEach((dot, i) => {
      dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); });
    });

    const timer = setInterval(() => { if (!paused) goTo(current + 1); }, interval);
    if (reducedMotion) clearInterval(timer);

    // Swipe support
    let touchStartX = 0, touchStartY = 0, swiping = false;
    carousel.addEventListener('touchstart', e => {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
      swiping = true;
    }, { passive: true });
    carousel.addEventListener('touchmove', e => {
      if (!swiping) return;
      const dy = Math.abs(e.touches[0].clientY - touchStartY);
      const dx = Math.abs(e.touches[0].clientX - touchStartX);
      if (dy > dx) swiping = false;
    }, { passive: true });
    carousel.addEventListener('touchend', e => {
      if (!swiping) return;
      const diff = e.changedTouches[0].clientX - touchStartX;
      if (Math.abs(diff) > 50) {
        goTo(diff < 0 ? current + 1 : current - 1);
      }
      swiping = false;
    }, { passive: true });
  });
}

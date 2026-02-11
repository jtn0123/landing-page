import { updateParallaxMesh } from './parallax.ts';

export function init(): void {
  // Unified scroll listener — progress bar, back-to-top, parallax mesh, sticky header
  const scrollProgress = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');
  const header = document.getElementById('site-header');

  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    if (scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = pct + '%';
    }
    if (backToTop) {
      backToTop.classList.toggle('visible', scrollTop > 400);
    }
    if (header) {
      header.classList.toggle('scrolled', scrollTop > 40);
    }
    updateParallaxMesh();
  }, { passive: true });

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Fade-in on scroll
  const fadeEls = document.querySelectorAll('.fade-in');
  const fadeObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          fadeObserver.unobserve(e.target);
        }
      });
    },
    { threshold: 0.15 },
  );
  fadeEls.forEach((el) => fadeObserver.observe(el));
}

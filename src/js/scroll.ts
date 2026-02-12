import { updateParallaxMesh } from './parallax.ts';

function initProgressDots(): void {
  const sections = [
    { id: 'main-content', label: 'Projects' },
    { id: 'tech-section', label: 'Tech' },
    { id: 'activity', label: 'Activity' },
  ];

  const container = document.createElement('nav');
  container.className = 'progress-dots';
  container.ariaLabel = 'Section progress';

  const dots: HTMLButtonElement[] = sections.map((s) => {
    const dot = document.createElement('button');
    dot.className = 'progress-dot';
    dot.ariaLabel = s.label;
    dot.addEventListener('click', () => {
      const el = document.getElementById(s.id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    });
    container.appendChild(dot);
    return dot;
  });

  document.body.appendChild(container);

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = sections.findIndex((s) => s.id === entry.target.id);
          if (idx >= 0) {
            dots.forEach((d, i) => d.classList.toggle('active', i === idx));
          }
        }
      });
    },
    { threshold: 0.2 },
  );

  sections.forEach((s) => {
    const el = document.getElementById(s.id);
    if (el) observer.observe(el);
  });
}


export function init(): void {
  // Unified scroll listener — progress bar, back-to-top, parallax mesh, sticky header
  const scrollProgress = document.getElementById('scroll-progress');
  const backToTop = document.getElementById('back-to-top');
  const header = document.getElementById('site-header');

  globalThis.addEventListener('scroll', () => {
    const scrollTop = globalThis.scrollY;
    if (scrollProgress) {
      const docHeight = document.documentElement.scrollHeight - globalThis.innerHeight;
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
      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Reading progress dots (mobile)
  initProgressDots();

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

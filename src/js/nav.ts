export function init(): void {
  // Smooth scroll nav
  document.querySelectorAll('[data-scroll]').forEach((a) => {
    a.addEventListener('click', (e: Event) => {
      e.preventDefault();
      const href = a.getAttribute('href');
      if (!href) return;
      const target = document.querySelector(href);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Active nav link on scroll
  const sections = [
    { id: 'main-content', el: document.getElementById('main-content') },
    { id: 'tech-section', el: document.getElementById('tech-section') },
    { id: 'activity', el: document.getElementById('activity') },
  ];
  const navLinks = document.querySelectorAll('.header-nav a[data-scroll]');
  const sectionObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => {
            a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
          });
        }
      });
    },
    { threshold: 0.2 },
  );
  sections.forEach((s) => {
    if (s.el) sectionObserver.observe(s.el);
  });

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      overlay.classList.add('active');
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        overlay.classList.remove('active');
      });
    }

    overlay.addEventListener('click', (e: Event) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });

    overlay.querySelectorAll('a[data-scroll]').forEach((a) => {
      a.addEventListener('click', (e: Event) => {
        e.preventDefault();
        overlay.classList.remove('active');
        const href = a.getAttribute('href');
        if (!href) return;
        const target = document.querySelector(href);
        if (target) {
          setTimeout(() => target.scrollIntoView({ behavior: 'smooth' }), 300);
        }
      });
    });

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
      }
    });
  }

  // Logo click scrolls to top
  const logo = document.querySelector<HTMLElement>('header h1');
  if (logo) {
    logo.style.cursor = 'pointer';
    logo.addEventListener('click', () => {
      globalThis.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Keyboard nav for cards
  document.querySelectorAll('.card[data-link]').forEach((card) => {
    card.addEventListener('keydown', (e: Event) => {
      if ((e as KeyboardEvent).key === 'Enter') {
        const link = card.querySelector<HTMLElement>('.btn-primary');
        if (link) link.click();
      }
    });
  });

  // Page exit transition for same-origin links
  document.querySelectorAll('.btn-primary').forEach((btn) => {
    const url = btn.getAttribute('href');
    if (!url || btn.classList.contains('btn-disabled')) return;
    const isSameOrigin = url.startsWith('/') || url.startsWith(globalThis.location.origin);
    if (isSameOrigin) {
      btn.addEventListener('click', (e: Event) => {
        e.preventDefault();
        const navigate = (): void => {
          globalThis.location.href = url;
        };
        const vt = (document as unknown as Record<string, unknown>).startViewTransition as
          | ((cb: () => void) => void)
          | undefined;
        if (vt) {
          vt(() => {
            navigate();
          });
        } else {
          document.body.classList.add('page-exit');
          setTimeout(navigate, 300);
        }
      });
    }
  });
}

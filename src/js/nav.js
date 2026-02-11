export function init() {
  // Smooth scroll nav
  document.querySelectorAll('[data-scroll]').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(a.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // Sticky header
  const header = document.getElementById('site-header');
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  }, { passive: true });

  // Active nav link on scroll
  const sections = [
    { id: 'main-content', el: document.getElementById('main-content') },
    { id: 'tech-section', el: document.getElementById('tech-section') },
    { id: 'activity', el: document.getElementById('activity') }
  ];
  const navLinks = document.querySelectorAll('.header-nav a[data-scroll]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.2 });
  sections.forEach(s => { if (s.el) sectionObserver.observe(s.el); });

  // Hamburger menu
  const hamburger = document.getElementById('hamburger');
  const overlay = document.getElementById('mobile-nav-overlay');
  const closeBtn = document.getElementById('mobile-nav-close');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', () => {
      overlay.classList.add('active');
    });

    closeBtn.addEventListener('click', () => {
      overlay.classList.remove('active');
    });

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.classList.remove('active');
      }
    });

    overlay.querySelectorAll('a[data-scroll]').forEach(a => {
      a.addEventListener('click', () => {
        overlay.classList.remove('active');
      });
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && overlay.classList.contains('active')) {
        overlay.classList.remove('active');
      }
    });
  }

  // Keyboard nav for cards
  document.querySelectorAll('.card[data-link]').forEach(card => {
    card.addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        const link = card.querySelector('.btn-primary');
        if (link) link.click();
      }
    });
  });

  // Page exit transition for internal links
  document.querySelectorAll('.btn-primary').forEach(btn => {
    const url = btn.getAttribute('href');
    if (!url || btn.classList.contains('btn-disabled')) return;
    if (url.includes('neuhard.dev') || url.startsWith('/')) {
      btn.addEventListener('click', e => {
        e.preventDefault();
        document.body.classList.add('page-exit');
        setTimeout(() => { window.location = url; }, 300);
      });
    }
  });
}

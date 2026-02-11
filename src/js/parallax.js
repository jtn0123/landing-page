import { isMobile, reducedMotion } from '../main.js';

export function init() {
  // Card parallax tilt (desktop only)
  if (!isMobile && !reducedMotion) {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transition = 'transform 0.3s ease';
        card.style.transform = '';
        card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
      });
    });
  }

  // Parallax background mesh (desktop only)
  if (!isMobile) {
    const mesh = document.getElementById('parallax-mesh');
    if (mesh) {
      window.addEventListener('scroll', () => {
        mesh.style.transform = `translateY(${window.scrollY * 0.1}px)`;
      }, { passive: true });
    }
  }
}

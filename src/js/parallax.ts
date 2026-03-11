/**
 * Parallax effects — card tilt on hover and background mesh parallax.
 * @module parallax
 */
import { isMobile, reducedMotion } from './config.ts';

/** Initialize card parallax tilt effect (desktop only, respects reduced motion). */
export function init(): void {
  document.querySelectorAll('.card').forEach((card) => {
    if ((card as HTMLElement).dataset.parallaxInit === 'true') return;
    (card as HTMLElement).dataset.parallaxInit = 'true';
    card.addEventListener('mousemove', (e: Event) => {
      const el = card as HTMLElement;
      if (isMobile.value || reducedMotion) {
        el.style.transform = '';
        return;
      }
      const me = e as MouseEvent;
      const rect = el.getBoundingClientRect();
      const x = (me.clientX - rect.left) / rect.width - 0.5;
      const y = (me.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      const el = card as HTMLElement;
      el.style.transition = 'transform 0.3s ease';
      el.style.transform = '';
      el.addEventListener(
        'transitionend',
        () => {
          el.style.transition = '';
        },
        { once: true },
      );
    });
  });
}

/** Called from the unified scroll listener in scroll.ts */
export function updateParallaxMesh(): void {
  if (isMobile.value) return;
  const mesh = document.getElementById('parallax-mesh');
  if (mesh) {
    mesh.style.transform = `translateY(${globalThis.scrollY * 0.1}px)`;
  }
}

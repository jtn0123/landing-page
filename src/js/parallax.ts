import { isMobile, reducedMotion } from '../main.ts';

/**
 * Initialize card parallax tilt effects on desktop when motion is allowed.
 *
 * When not on mobile and reduced motion is disabled, attaches mouse event handlers
 * to elements with the `card` class to apply a 3D tilt transform on hover and
 * reset it on mouse leave. Does nothing when on mobile (`isMobile.value`) or
 * when reduced motion is enabled.
 */
export function init(): void {
  // Card parallax tilt (desktop only)
  if (!isMobile.value && !reducedMotion) {
    document.querySelectorAll('.card').forEach((card) => {
      card.addEventListener('mousemove', (e: Event) => {
        const me = e as MouseEvent;
        const el = card as HTMLElement;
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

}

/**
 * Adjusts the vertical position of the parallax mesh element based on page scroll.
 *
 * If the app is in a mobile state (`isMobile.value` is true) the function returns immediately.
 * When an element with id `parallax-mesh` exists, its `style.transform` is set to `translateY(window.scrollY * 0.1px)`.
 * If the element is not present the function does nothing.
 */
export function updateParallaxMesh(): void {
  if (isMobile.value) return;
  const mesh = document.getElementById('parallax-mesh');
  if (mesh) {
    mesh.style.transform = `translateY(${window.scrollY * 0.1}px)`;
  }
}
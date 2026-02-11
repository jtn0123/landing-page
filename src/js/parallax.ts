import { isMobile, reducedMotion } from '../main.ts';

export function init(): void {
  // Card parallax tilt (desktop only)
  if (!isMobile && !reducedMotion) {
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

  // Parallax background mesh (desktop only)
  if (!isMobile) {
    const mesh = document.getElementById('parallax-mesh');
    if (mesh) {
      window.addEventListener(
        'scroll',
        () => {
          mesh.style.transform = `translateY(${window.scrollY * 0.1}px)`;
        },
        { passive: true },
      );
    }
  }
}

/**
 * Lightbox dialog — fullscreen image preview with pinch-zoom and focus trap.
 * @module lightbox
 */

function getDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

/** Initialize the lightbox: click-to-open, close button, focus trap, pinch-zoom. */
export function init(): void {
  const lightbox = document.getElementById('lightbox') as HTMLDialogElement | null;
  const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement | null;
  const closeBtn = document.getElementById('lightbox-close') as HTMLButtonElement | null;
  if (!lightbox || !lightboxImg) return;
  let currentScale = 1;

  function closeLightbox(): void {
    lightbox!.close();
    lightboxImg!.style.transform = '';
    currentScale = 1;
  }

  document.querySelectorAll('.lightbox-trigger').forEach((img) => {
    (img as HTMLElement).style.cursor = 'zoom-in';
    img.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lightboxImg.style.transform = '';
      currentScale = 1;
      lightboxImg.src = (img as HTMLImageElement).src;
      lightboxImg.alt = (img as HTMLImageElement).alt;
      lightbox.showModal();
    });
  });

  // Close button
  if (closeBtn) {
    closeBtn.addEventListener('click', (e: Event) => {
      e.stopPropagation();
      closeLightbox();
    });
  }

  lightbox.addEventListener('click', () => {
    closeLightbox();
  });

  // Prevent close when clicking the image itself
  lightboxImg.addEventListener('click', (e: Event) => {
    e.stopPropagation();
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && lightbox.open) {
      closeLightbox();
    }
  });

  // Focus trap within lightbox dialog
  lightbox.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key !== 'Tab' || !lightbox.open) return;
    const focusable = lightbox.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }
  });

  // Pinch-to-zoom
  let initialDist = 0;
  lightboxImg.addEventListener(
    'touchstart',
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        initialDist = getDist(e.touches);
      }
    },
    { passive: false },
  );
  lightboxImg.addEventListener(
    'touchmove',
    (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dist = getDist(e.touches);
        const scale = Math.min(Math.max(currentScale * (dist / initialDist), 1), 4);
        lightboxImg.style.transform = `scale(${scale})`;
      }
    },
    { passive: false },
  );
  lightboxImg.addEventListener('touchend', (e: TouchEvent) => {
    if (e.touches.length < 2) {
      currentScale = Number.parseFloat(lightboxImg.style.transform.replaceAll(/[^0-9.]/g, '') || '1');
      if (Number.isNaN(currentScale) || currentScale < 1) currentScale = 1;
    }
  });
}

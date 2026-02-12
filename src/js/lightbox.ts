/**
 * Compute the Euclidean distance between the first two touch points.
 *
 * @param touches - A TouchList with at least two touches
 * @returns The distance in pixels between `touches[0]` and `touches[1]`
 */
function getDist(touches: TouchList): number {
  const dx = touches[0].clientX - touches[1].clientX;
  const dy = touches[0].clientY - touches[1].clientY;
  return Math.hypot(dx, dy);
}

/**
 * Initialize the image lightbox UI, its open/close controls, keyboard handling, and pinch-to-zoom behavior.
 *
 * Sets up click handlers on elements with the `.lightbox-trigger` class to open a modal dialog showing the clicked image,
 * a click handler on the dialog to close it, and a global Escape key handler to close the lightbox when open.
 * Also enables pinch-to-zoom on the displayed image with scale clamped between 1 and 4 and resets transform/scale when closing
 * or opening a new image. If required DOM elements are missing, the function exits without registering handlers.
 */
export function init(): void {
  const lightbox = document.getElementById('lightbox') as HTMLDialogElement | null;
  const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement | null;
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

  lightbox.addEventListener('click', () => {
    closeLightbox();
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape' && lightbox.open) {
      closeLightbox();
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
      currentScale = parseFloat(lightboxImg.style.transform.replace(/[^0-9.]/g, '') || '1');
      if (isNaN(currentScale) || currentScale < 1) currentScale = 1;
    }
  });
}
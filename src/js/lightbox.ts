export function init(): void {
  const lightbox = document.getElementById('lightbox');
  const lightboxImg = document.getElementById('lightbox-img') as HTMLImageElement | null;
  if (!lightbox || !lightboxImg) return;
  let currentScale = 1;

  document.querySelectorAll('.lightbox-trigger').forEach((img) => {
    (img as HTMLElement).style.cursor = 'zoom-in';
    img.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      lightboxImg.style.transform = '';
      currentScale = 1;
      lightboxImg.src = (img as HTMLImageElement).src;
      lightboxImg.alt = (img as HTMLImageElement).alt;
      lightbox.classList.add('active');
    });
  });

  lightbox.addEventListener('click', () => {
    lightbox.classList.remove('active');
    lightboxImg.style.transform = '';
    currentScale = 1;
  });

  document.addEventListener('keydown', (e: KeyboardEvent) => {
    if (e.key === 'Escape') lightbox.classList.remove('active');
  });

  // Pinch-to-zoom
  let initialDist = 0;
  function getDist(touches: TouchList): number {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }
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

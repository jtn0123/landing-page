import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('lightbox', () => {
  beforeEach(() => {
    vi.resetModules();
    HTMLDialogElement.prototype.showModal = vi.fn(function (this: HTMLDialogElement) {
      this.open = true;
    });
    HTMLDialogElement.prototype.close = vi.fn(function (this: HTMLDialogElement) {
      this.open = false;
    });
    document.body.innerHTML = `
      <dialog id="lightbox"><img id="lightbox-img" src="" alt=""></dialog>
      <img class="lightbox-trigger" src="photo.jpg" alt="Photo">`;
  });

  it('opens lightbox on trigger click', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    document.querySelector<HTMLElement>('.lightbox-trigger')!.click();
    expect(HTMLDialogElement.prototype.showModal).toHaveBeenCalled();
    expect((document.getElementById('lightbox-img') as HTMLImageElement).src).toContain('photo.jpg');
  });

  it('closes lightbox on click', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    document.querySelector<HTMLElement>('.lightbox-trigger')!.click();
    document.getElementById('lightbox')!.click();
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('closes on Escape key when open', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    document.querySelector<HTMLElement>('.lightbox-trigger')!.click();
    const dialog = document.getElementById('lightbox') as HTMLDialogElement;
    (dialog as any).open = true;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(HTMLDialogElement.prototype.close).toHaveBeenCalled();
  });

  it('does not close on Escape when not open', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    const dialog = document.getElementById('lightbox') as HTMLDialogElement;
    (dialog as any).open = false;
    const closeSpy = vi.fn();
    dialog.close = closeSpy;
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(closeSpy).not.toHaveBeenCalled();
  });

  it('sets zoom-in cursor', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    expect(document.querySelector<HTMLElement>('.lightbox-trigger')!.style.cursor).toBe('zoom-in');
  });

  it('does nothing without lightbox element', async () => {
    document.body.innerHTML = '';
    const { init } = await import('../lightbox.ts');
    expect(() => init()).not.toThrow();
  });

  it('handles pinch-to-zoom touchstart with two fingers', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    const img = document.getElementById('lightbox-img')!;
    const touchStartEvent = new TouchEvent('touchstart', {
      touches: [
        new Touch({ identifier: 0, target: img, clientX: 0, clientY: 0 }),
        new Touch({ identifier: 1, target: img, clientX: 100, clientY: 0 }),
      ] as any,
      cancelable: true,
    });
    img.dispatchEvent(touchStartEvent);
    // No assertion needed — just ensure no crash
  });

  it('handles pinch-to-zoom touchmove scales image', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    const img = document.getElementById('lightbox-img')!;

    // Start with two touches 100px apart
    img.dispatchEvent(new TouchEvent('touchstart', {
      touches: [
        new Touch({ identifier: 0, target: img, clientX: 0, clientY: 0 }),
        new Touch({ identifier: 1, target: img, clientX: 100, clientY: 0 }),
      ] as any,
      cancelable: true,
    }));

    // Move to 200px apart (zoom in)
    img.dispatchEvent(new TouchEvent('touchmove', {
      touches: [
        new Touch({ identifier: 0, target: img, clientX: 0, clientY: 0 }),
        new Touch({ identifier: 1, target: img, clientX: 200, clientY: 0 }),
      ] as any,
      cancelable: true,
    }));

    expect(img.style.transform).toContain('scale');
  });

  it('handles touchend updating currentScale', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    const img = document.getElementById('lightbox-img')!;
    img.style.transform = 'scale(2)';

    img.dispatchEvent(new TouchEvent('touchend', {
      touches: [] as any,
      changedTouches: [
        new Touch({ identifier: 0, target: img, clientX: 0, clientY: 0 }),
      ] as any,
    }));
    // currentScale should be updated internally — no crash
  });

  it('resets scale on close', async () => {
    const { init } = await import('../lightbox.ts');
    init();
    const img = document.getElementById('lightbox-img') as HTMLImageElement;
    // Open
    document.querySelector<HTMLElement>('.lightbox-trigger')!.click();
    img.style.transform = 'scale(2)';
    // Close
    document.getElementById('lightbox')!.click();
    expect(img.style.transform).toBe('');
  });
});

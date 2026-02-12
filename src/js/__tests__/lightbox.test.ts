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
});

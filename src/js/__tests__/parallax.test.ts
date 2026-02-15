import { describe, it, expect, beforeEach, vi } from 'vitest';

async function loadWithMocks(overrides: { isMobile?: boolean; reducedMotion?: boolean } = {}) {
  vi.doMock('../config.ts', () => ({
    reducedMotion: overrides.reducedMotion ?? false,
    isMobile: { value: overrides.isMobile ?? false },
  }));
  return import('../parallax.ts');
}

describe('parallax', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div class="card" style="width:200px;height:200px"></div><div id="parallax-mesh"></div>';
  });

  it('updateParallaxMesh sets transform based on scrollY', async () => {
    const mod = await loadWithMocks();
    Object.defineProperty(globalThis, 'scrollY', { value: 100, configurable: true });
    mod.updateParallaxMesh();
    expect(document.getElementById('parallax-mesh')!.style.transform).toBe('translateY(10px)');
  });

  it('updateParallaxMesh does nothing without mesh element', async () => {
    document.body.innerHTML = '<div class="card"></div>';
    const mod = await loadWithMocks();
    expect(() => mod.updateParallaxMesh()).not.toThrow();
  });

  it('init runs without error', async () => {
    const mod = await loadWithMocks();
    expect(() => mod.init()).not.toThrow();
  });

  it('updateParallaxMesh skips when isMobile', async () => {
    const mod = await loadWithMocks({ isMobile: true });
    const mesh = document.getElementById('parallax-mesh')!;
    mesh.style.transform = '';
    mod.updateParallaxMesh();
    expect(mesh.style.transform).toBe('');
  });

  it('init does not throw on desktop with cards', async () => {
    const mod = await loadWithMocks();
    expect(() => mod.init()).not.toThrow();
    expect(document.querySelectorAll('.card').length).toBe(1);
  });

  it('skips tilt when reducedMotion is true', async () => {
    const mod = await loadWithMocks({ reducedMotion: true });
    mod.init();
    const card = document.querySelector('.card') as HTMLElement;
    card.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true }));
    expect(card.style.transform).toBe('');
  });

  it('mousemove applies tilt transform on desktop', async () => {
    const mod = await loadWithMocks();
    mod.init();
    const card = document.querySelector('.card') as HTMLElement;
    card.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true }));
    expect(card.style.transform).toContain('perspective');
  });

  it('mouseleave resets transform', async () => {
    const mod = await loadWithMocks();
    mod.init();
    const card = document.querySelector('.card') as HTMLElement;
    card.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 150, clientY: 50, bubbles: true }));
    expect(card.style.transform).toContain('perspective');
    card.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
    expect(card.style.transform).toBe('');
  });

  it('skips init entirely when isMobile', async () => {
    const mod = await loadWithMocks({ isMobile: true });
    mod.init();
    const card = document.querySelector('.card') as HTMLElement;
    card.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true }));
    expect(card.style.transform).toBe('');
  });
});

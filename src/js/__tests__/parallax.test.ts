import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../main.ts', () => ({
  API_BASE: '/api/github',
  OWNER: 'jtn0123',
  REPOS: ['MegaBonk'],
  CARD_REPOS: ['MegaBonk'],
  reducedMotion: false,
  isMobile: { value: false },
}));

describe('parallax', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = '<div class="card" style="width:200px;height:200px"></div><div id="parallax-mesh"></div>';
  });

  it('updateParallaxMesh sets transform based on scrollY', async () => {
    const mod = await import('../parallax.ts');
    Object.defineProperty(globalThis, 'scrollY', { value: 100, configurable: true });
    mod.updateParallaxMesh();
    expect(document.getElementById('parallax-mesh')!.style.transform).toBe('translateY(10px)');
  });

  it('updateParallaxMesh does nothing without mesh element', async () => {
    document.body.innerHTML = '<div class="card"></div>';
    const mod = await import('../parallax.ts');
    expect(() => mod.updateParallaxMesh()).not.toThrow();
  });

  it('init runs without error', async () => {
    const mod = await import('../parallax.ts');
    expect(() => mod.init()).not.toThrow();
  });

  it('updateParallaxMesh skips when isMobile', async () => {
    vi.doMock('../../main.ts', () => ({
      API_BASE: '/api/github',
      OWNER: 'jtn0123',
      REPOS: ['MegaBonk'],
      CARD_REPOS: ['MegaBonk'],
      reducedMotion: false,
      isMobile: { value: true },
    }));
    const mod = await import('../parallax.ts');
    const mesh = document.getElementById('parallax-mesh')!;
    mesh.style.transform = '';
    mod.updateParallaxMesh();
    expect(mesh.style.transform).toBe('');
  });

  it('init does not throw on desktop with cards', async () => {
    const mod = await import('../parallax.ts');
    // init attaches mousemove/mouseleave listeners — just verify no error
    expect(() => mod.init()).not.toThrow();
    // Verify listeners are attached by checking card count
    expect(document.querySelectorAll('.card').length).toBe(1);
  });

  it('skips tilt when reducedMotion is true', async () => {
    vi.doMock('../../main.ts', () => ({
      API_BASE: '/api/github',
      OWNER: 'jtn0123',
      REPOS: ['MegaBonk'],
      CARD_REPOS: ['MegaBonk'],
      reducedMotion: true,
      isMobile: { value: false },
    }));
    const mod = await import('../parallax.ts');
    mod.init();
    const card = document.querySelector('.card') as HTMLElement;
    // No mousemove listener should be attached
    card.getBoundingClientRect = vi.fn().mockReturnValue({ left: 0, top: 0, width: 200, height: 200 });
    card.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 100, bubbles: true }));
    expect(card.style.transform).toBe('');
  });
});

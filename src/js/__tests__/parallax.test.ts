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
    Object.defineProperty(window, 'scrollY', { value: 100, configurable: true });
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
});

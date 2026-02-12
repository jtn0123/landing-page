import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('../../main.ts', () => ({
  API_BASE: '/api/github',
  OWNER: 'jtn0123',
  REPOS: ['MegaBonk'],
  CARD_REPOS: ['MegaBonk'],
  reducedMotion: false,
  isMobile: { value: false },
}));

describe('scroll', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <div id="scroll-progress" style="width:0%"></div>
      <button id="back-to-top"></button>
      <header id="site-header"></header>
      <div id="parallax-mesh"></div>
      <section id="main-content" class="fade-in"></section>
      <section id="tech-section"></section>
      <section id="activity"></section>`;
    window.scrollTo = vi.fn() as any;
  });

  it('creates progress dots', async () => {
    const { init } = await import('../scroll.ts');
    init();
    expect(document.querySelectorAll('.progress-dot').length).toBe(3);
  });

  it('back-to-top scrolls to top on click', async () => {
    const { init } = await import('../scroll.ts');
    init();
    document.getElementById('back-to-top')!.click();
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('scroll shows back-to-top when scrolled past 400', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('back-to-top')!.classList.contains('visible')).toBe(true);
  });

  it('adds scrolled class to header', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(window, 'scrollY', { value: 50, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('site-header')!.classList.contains('scrolled')).toBe(true);
  });

  it('updates scroll progress width', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(window, 'scrollY', { value: 600, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 600, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    const pct = document.getElementById('scroll-progress')!.style.width;
    expect(pct).toBe('50%');
  });
});

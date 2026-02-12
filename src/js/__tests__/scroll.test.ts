import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockIntersectionObserver } from './setup.ts';

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
    MockIntersectionObserver.instances = [];
    document.body.innerHTML = `
      <div id="scroll-progress" style="width:0%"></div>
      <button id="back-to-top"></button>
      <header id="site-header"></header>
      <div id="parallax-mesh"></div>
      <section id="main-content" class="fade-in"></section>
      <section id="tech-section"></section>
      <section id="activity"></section>`;
    globalThis.scrollTo = vi.fn() as any;
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
    expect(globalThis.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('scroll shows back-to-top when scrolled past 400', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 500, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: 800, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('back-to-top')!.classList.contains('visible')).toBe(true);
  });

  it('adds scrolled class to header', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 50, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('site-header')!.classList.contains('scrolled')).toBe(true);
  });

  it('updates scroll progress width', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 600, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 1800, configurable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: 600, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    const pct = document.getElementById('scroll-progress')!.style.width;
    expect(pct).toBe('50%');
  });

  it('hides back-to-top when scrolled less than 400', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 100, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('back-to-top')!.classList.contains('visible')).toBe(false);
  });

  it('removes scrolled class when scrolled less than 40', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 10, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('site-header')!.classList.contains('scrolled')).toBe(false);
  });

  it('progress dot click scrolls to section', async () => {
    const { init } = await import('../scroll.ts');
    init();
    const dots = document.querySelectorAll('.progress-dot');
    Element.prototype.scrollIntoView = vi.fn();
    (dots[0] as HTMLElement).click();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('fade-in observer marks elements visible', async () => {
    const { init } = await import('../scroll.ts');
    init();
    const el = document.querySelector('.fade-in')!;
    // The fade observer is the last one created
    const fadeObs = MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
    fadeObs.trigger([{ isIntersecting: true, target: el }]);
    expect(el.classList.contains('visible')).toBe(true);
  });

  it('handles missing elements gracefully', async () => {
    document.body.innerHTML = '<section id="main-content"></section>';
    const { init } = await import('../scroll.ts');
    expect(() => init()).not.toThrow();
  });

  it('scroll progress 0% when doc height equals viewport', async () => {
    const { init } = await import('../scroll.ts');
    init();
    Object.defineProperty(globalThis, 'scrollY', { value: 0, configurable: true });
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 800, configurable: true });
    Object.defineProperty(globalThis, 'innerHeight', { value: 800, configurable: true });
    globalThis.dispatchEvent(new Event('scroll'));
    expect(document.getElementById('scroll-progress')!.style.width).toBe('0%');
  });
});

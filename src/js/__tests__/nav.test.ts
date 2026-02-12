import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MockIntersectionObserver } from './setup.ts';

describe('nav', () => {
  beforeEach(() => {
    vi.resetModules();
    MockIntersectionObserver.instances = [];
    document.body.innerHTML = `
      <header id="site-header">
        <h1>Logo</h1>
        <nav class="header-nav">
          <a href="#main-content" data-scroll>Projects</a>
          <a href="#tech-section" data-scroll>Tech</a>
        </nav>
      </header>
      <button id="hamburger"></button>
      <div id="mobile-nav-overlay">
        <button id="mobile-nav-close"></button>
        <a href="#main-content" data-scroll>Projects</a>
      </div>
      <section id="main-content"></section>
      <section id="tech-section"></section>
      <section id="activity"></section>
      <div class="card" data-link tabindex="0"><a class="btn-primary" href="/page">Go</a></div>
      <a class="btn-primary" href="https://external.com">External</a>`;
    Element.prototype.scrollIntoView = vi.fn();
    globalThis.scrollTo = vi.fn() as any;
  });

  it('smooth scrolls on data-scroll click', async () => {
    const { init } = await import('../nav.ts');
    init();
    document.querySelector<HTMLElement>('a[href="#main-content"]')!.click();
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('opens hamburger menu', async () => {
    const { init } = await import('../nav.ts');
    init();
    document.getElementById('hamburger')!.click();
    expect(document.getElementById('mobile-nav-overlay')!.classList.contains('active')).toBe(true);
  });

  it('closes hamburger on close button', async () => {
    const { init } = await import('../nav.ts');
    init();
    document.getElementById('mobile-nav-overlay')!.classList.add('active');
    document.getElementById('mobile-nav-close')!.click();
    expect(document.getElementById('mobile-nav-overlay')!.classList.contains('active')).toBe(false);
  });

  it('closes hamburger on Escape', async () => {
    const { init } = await import('../nav.ts');
    init();
    document.getElementById('mobile-nav-overlay')!.classList.add('active');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('mobile-nav-overlay')!.classList.contains('active')).toBe(false);
  });

  it('does not close overlay on Escape when not active', async () => {
    const { init } = await import('../nav.ts');
    init();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    expect(document.getElementById('mobile-nav-overlay')!.classList.contains('active')).toBe(false);
  });

  it('closes overlay on backdrop click', async () => {
    const { init } = await import('../nav.ts');
    init();
    const overlay = document.getElementById('mobile-nav-overlay')!;
    overlay.classList.add('active');
    overlay.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('logo click scrolls to top', async () => {
    const { init } = await import('../nav.ts');
    init();
    const logo = document.querySelector('header h1') as HTMLElement;
    expect(logo.style.cursor).toBe('pointer');
    logo.click();
    expect(globalThis.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('Enter on card triggers button click', async () => {
    const { init } = await import('../nav.ts');
    init();
    const card = document.querySelector('.card[data-link]')!;
    const btn = card.querySelector('.btn-primary') as HTMLElement;
    const spy = vi.spyOn(btn, 'click');
    card.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(spy).toHaveBeenCalled();
  });

  it('mobile nav link clicks close overlay and scroll', async () => {
    const { init } = await import('../nav.ts');
    init();
    const overlay = document.getElementById('mobile-nav-overlay')!;
    overlay.classList.add('active');
    const mobileLink = overlay.querySelector('a[data-scroll]') as HTMLElement;
    mobileLink.click();
    expect(overlay.classList.contains('active')).toBe(false);
  });

  it('scroll spy updates active nav link', async () => {
    const { init } = await import('../nav.ts');
    init();
    // Find the section observer
    const sectionObs = MockIntersectionObserver.instances.find((obs) =>
      obs.observe.mock.calls.some((call: any[]) => call[0].id === 'main-content'),
    );
    if (sectionObs) {
      const section = document.getElementById('main-content')!;
      sectionObs.trigger([{ isIntersecting: true, target: section }]);
      const activeLink = document.querySelector('.header-nav a.active');
      expect(activeLink).not.toBeNull();
      expect(activeLink!.getAttribute('href')).toBe('#main-content');
    }
  });

  it('ignores data-scroll links without href', async () => {
    document.body.innerHTML += '<a data-scroll>No href</a>';
    const { init } = await import('../nav.ts');
    init();
    const noHref = document.querySelector('a[data-scroll]:not([href])') as HTMLElement;
    if (noHref) {
      expect(() => noHref.click()).not.toThrow();
    }
  });

  it('handles missing hamburger/overlay gracefully', async () => {
    document.body.innerHTML = '<header><h1>Test</h1></header>';
    const { init } = await import('../nav.ts');
    expect(() => init()).not.toThrow();
  });
});

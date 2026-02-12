import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('nav', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <header id="site-header">
        <h1>Logo</h1>
        <nav class="header-nav">
          <a href="#main-content" data-scroll>Projects</a>
        </nav>
      </header>
      <button id="hamburger"></button>
      <div id="mobile-nav-overlay">
        <button id="mobile-nav-close"></button>
        <a href="#main-content" data-scroll>Projects</a>
      </div>
      <section id="main-content"></section>
      <div class="card" data-link tabindex="0"><a class="btn-primary" href="/page">Go</a></div>`;
    Element.prototype.scrollIntoView = vi.fn();
    window.scrollTo = vi.fn() as any;
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
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
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
});

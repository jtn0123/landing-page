import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('filter', () => {
  beforeEach(() => {
    vi.resetModules();
    document.body.innerHTML = `
      <section id="main-content">
        <div class="card"><div class="tech"><span>TypeScript</span><span>React</span></div></div>
        <div class="card"><div class="tech"><span>Python</span><span>Docker</span></div></div>
        <div class="card"><div class="tech"><span>Swift</span></div></div>
      </section>`;
  });

  it('creates filter bar with pills', async () => {
    const { init } = await import('../filter.ts');
    init();
    const pills = document.querySelectorAll('.filter-pill');
    expect(pills.length).toBe(6);
    expect(pills[0].classList.contains('active')).toBe(true);
  });

  it('filters cards by tag', async () => {
    const { init } = await import('../filter.ts');
    init();
    const pills = document.querySelectorAll('.filter-pill');
    (pills[1] as HTMLElement).click();
    const cards = document.querySelectorAll('.card');
    expect(cards[0].classList.contains('filter-visible')).toBe(true);
    expect(cards[1].classList.contains('filter-hidden')).toBe(true);
  });

  it('shows all cards when All is clicked', async () => {
    const { init } = await import('../filter.ts');
    init();
    const pills = document.querySelectorAll('.filter-pill');
    (pills[1] as HTMLElement).click();
    (pills[0] as HTMLElement).click();
    document.querySelectorAll('.card').forEach((c) => {
      expect(c.classList.contains('filter-visible')).toBe(true);
    });
  });

  it('does nothing without main-content', async () => {
    document.body.innerHTML = '';
    const { init } = await import('../filter.ts');
    expect(() => init()).not.toThrow();
  });
});

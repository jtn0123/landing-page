import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

vi.mock('../../main.ts', () => ({
  API_BASE: '/api/github',
  OWNER: 'jtn0123',
  REPOS: ['MegaBonk'],
  CARD_REPOS: ['MegaBonk'],
  reducedMotion: false,
  isMobile: { value: false },
}));

describe('carousel', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    document.body.innerHTML = `
      <div class="carousel" data-interval="1000">
        <div class="carousel-slide active">Slide 1</div>
        <div class="carousel-slide">Slide 2</div>
        <div class="carousel-slide">Slide 3</div>
        <span class="dot active"></span>
        <span class="dot"></span>
        <span class="dot"></span>
      </div>`;
  });

  afterEach(() => { vi.useRealTimers(); });

  it('auto-advances slides', async () => {
    const { init } = await import('../carousel.ts');
    init();
    vi.advanceTimersByTime(1000);
    expect(document.querySelectorAll('.carousel-slide')[1].classList.contains('active')).toBe(true);
  });

  it('clicking dot goes to that slide', async () => {
    const { init } = await import('../carousel.ts');
    init();
    (document.querySelectorAll('.dot')[2] as HTMLElement).click();
    expect(document.querySelectorAll('.carousel-slide')[2].classList.contains('active')).toBe(true);
  });

  it('pauses on mouseenter', async () => {
    const { init } = await import('../carousel.ts');
    init();
    document.querySelector('.carousel')!.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(2000);
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });

  it('wraps around from last to first', async () => {
    const { init } = await import('../carousel.ts');
    init();
    vi.advanceTimersByTime(3000);
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });

  it('resumes after mouseleave', async () => {
    const { init } = await import('../carousel.ts');
    init();
    const carousel = document.querySelector('.carousel')!;
    carousel.dispatchEvent(new Event('mouseenter'));
    vi.advanceTimersByTime(1000);
    carousel.dispatchEvent(new Event('mouseleave'));
    vi.advanceTimersByTime(1000);
    expect(document.querySelectorAll('.carousel-slide')[1].classList.contains('active')).toBe(true);
  });
});

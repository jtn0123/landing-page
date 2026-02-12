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

  it('swipe left advances to next slide', async () => {
    const { init } = await import('../carousel.ts');
    init();
    const carousel = document.querySelector('.carousel')!;
    carousel.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: carousel, clientX: 200, clientY: 100 })] as any,
    }));
    carousel.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: carousel, clientX: 100, clientY: 100 })] as any,
      touches: [] as any,
    }));
    expect(document.querySelectorAll('.carousel-slide')[1].classList.contains('active')).toBe(true);
  });

  it('swipe right goes to previous slide', async () => {
    const { init } = await import('../carousel.ts');
    init();
    // First advance to slide 1
    vi.advanceTimersByTime(1000);
    const carousel = document.querySelector('.carousel')!;
    carousel.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: carousel, clientX: 100, clientY: 100 })] as any,
    }));
    carousel.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: carousel, clientX: 200, clientY: 100 })] as any,
      touches: [] as any,
    }));
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });

  it('ignores vertical swipes', async () => {
    const { init } = await import('../carousel.ts');
    init();
    const carousel = document.querySelector('.carousel')!;
    carousel.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: carousel, clientX: 200, clientY: 100 })] as any,
    }));
    // Vertical move should cancel swipe
    carousel.dispatchEvent(new TouchEvent('touchmove', {
      touches: [new Touch({ identifier: 0, target: carousel, clientX: 200, clientY: 200 })] as any,
    }));
    carousel.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: carousel, clientX: 100, clientY: 200 })] as any,
      touches: [] as any,
    }));
    // Should still be on slide 0
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });

  it('ignores small swipes', async () => {
    const { init } = await import('../carousel.ts');
    init();
    const carousel = document.querySelector('.carousel')!;
    carousel.dispatchEvent(new TouchEvent('touchstart', {
      touches: [new Touch({ identifier: 0, target: carousel, clientX: 200, clientY: 100 })] as any,
    }));
    carousel.dispatchEvent(new TouchEvent('touchend', {
      changedTouches: [new Touch({ identifier: 0, target: carousel, clientX: 180, clientY: 100 })] as any,
      touches: [] as any,
    }));
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });

  it('skips carousel with fewer than 2 slides', async () => {
    document.body.innerHTML = '<div class="carousel"><div class="carousel-slide active">Only one</div><span class="dot active"></span></div>';
    const { init } = await import('../carousel.ts');
    init();
    vi.advanceTimersByTime(5000);
    // No error, only slide stays active
    expect(document.querySelector('.carousel-slide.active')).not.toBeNull();
  });

  it('uses default interval when not specified', async () => {
    document.body.innerHTML = `
      <div class="carousel">
        <div class="carousel-slide active">Slide 1</div>
        <div class="carousel-slide">Slide 2</div>
        <span class="dot active"></span>
        <span class="dot"></span>
      </div>`;
    const { init } = await import('../carousel.ts');
    init();
    vi.advanceTimersByTime(4000);
    expect(document.querySelectorAll('.carousel-slide')[1].classList.contains('active')).toBe(true);
  });
});

describe('carousel with reducedMotion', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    vi.doMock('../../main.ts', () => ({
      API_BASE: '/api/github',
      OWNER: 'jtn0123',
      REPOS: ['MegaBonk'],
      CARD_REPOS: ['MegaBonk'],
      reducedMotion: true,
      isMobile: { value: false },
    }));
    document.body.innerHTML = `
      <div class="carousel" data-interval="1000">
        <div class="carousel-slide active">Slide 1</div>
        <div class="carousel-slide">Slide 2</div>
        <span class="dot active"></span>
        <span class="dot"></span>
      </div>`;
  });

  afterEach(() => { vi.useRealTimers(); });

  it('does not auto-advance with reduced motion', async () => {
    const { init } = await import('../carousel.ts');
    init();
    vi.advanceTimersByTime(5000);
    expect(document.querySelectorAll('.carousel-slide')[0].classList.contains('active')).toBe(true);
  });
});

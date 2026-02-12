import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('theme', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    document.body.innerHTML = '<button id="theme-toggle"></button><meta id="meta-theme-color" content="">';
    localStorage.clear();
    vi.resetModules();
  });

  it('defaults to dark when no localStorage', async () => {
    const { init } = await import('../theme.ts');
    init();
    expect(document.getElementById('theme-toggle')!.textContent).toBe('🌙');
  });

  it('applies light theme from localStorage', async () => {
    localStorage.setItem('theme', 'light');
    const { init } = await import('../theme.ts');
    init();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(document.getElementById('theme-toggle')!.textContent).toBe('☀️');
  });

  it('toggles theme on click', async () => {
    localStorage.setItem('theme', 'dark');
    const { init } = await import('../theme.ts');
    init();
    const btn = document.getElementById('theme-toggle')!;
    btn.click();
    expect(localStorage.getItem('theme')).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
    btn.click();
    expect(localStorage.getItem('theme')).toBe('dark');
  });

  it('updates meta theme color', async () => {
    localStorage.setItem('theme', 'light');
    const { init } = await import('../theme.ts');
    init();
    const meta = document.getElementById('meta-theme-color') as HTMLMetaElement;
    expect(meta.content).toBe('#f5f5f5');
  });

  it('does nothing without theme-toggle element', async () => {
    document.body.innerHTML = '';
    const { init } = await import('../theme.ts');
    expect(() => init()).not.toThrow();
  });
});

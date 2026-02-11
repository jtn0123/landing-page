export function init(): void {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;

  function getTheme(): string {
    return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  }

  function applyTheme(t: string): void {
    if (t === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      themeBtn!.textContent = '☀️';
    } else {
      document.documentElement.removeAttribute('data-theme');
      themeBtn!.textContent = '🌙';
    }
  }

  applyTheme(getTheme());
  themeBtn.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next);
  });
}

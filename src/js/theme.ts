function getTheme(): string {
  return (
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  );
}

function applyTheme(t: string, themeBtn: HTMLElement): void {
  if (t === 'light') {
    document.documentElement.dataset.theme = 'light';
    themeBtn.textContent = '☀️';
  } else {
    delete document.documentElement.dataset.theme;
    themeBtn.textContent = '🌙';
  }
  const metaTheme = document.getElementById('meta-theme-color') as HTMLMetaElement | null;
  if (metaTheme) metaTheme.content = t === 'light' ? '#f5f5f5' : '#0a0a0a';
}

export function init(): void {
  const themeBtn = document.getElementById('theme-toggle');
  if (!themeBtn) return;

  applyTheme(getTheme(), themeBtn);
  themeBtn.addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', next);
    applyTheme(next, themeBtn);
  });
}

/**
 * Determines the current theme preference.
 *
 * Checks localStorage for a stored 'theme' value and returns it if present; if not present, uses the system preference for color scheme.
 *
 * @returns `'light'` if the stored value is `'light'` or the system prefers a light color scheme, `'dark'` otherwise.
 */
function getTheme(): string {
  return (
    localStorage.getItem('theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark')
  );
}

/**
 * Apply the specified theme to the document and update the theme toggle button.
 *
 * Sets the document root theme state, updates the toggle button's text to reflect the theme,
 * and, if present, updates the meta element with id "meta-theme-color" to the matching color.
 *
 * @param t - Set to `'light'` to enable the light theme; set to `'dark'` to enable the dark theme. Other values are treated as dark.
 * @param themeBtn - The theme toggle button element whose text content will be updated to indicate the current theme.
 */
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

/**
 * Initializes the theme toggle UI: applies the current theme and wires the toggle button.
 *
 * Finds the element with id "theme-toggle" (no-op if missing), applies the current theme, and attaches a click handler that toggles between "light" and "dark", persists the choice to localStorage under "theme", and reapplies the selected theme.
 */
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
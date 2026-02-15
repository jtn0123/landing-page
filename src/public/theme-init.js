(function () {
  let t = null;
  try {
    t = localStorage.getItem('theme');
  } catch {
    t = null;
  }
  if (!t) {
    const prefersLight = globalThis.matchMedia?.('(prefers-color-scheme: light)').matches;
    t = prefersLight ? 'light' : 'dark';
  }
  if (t === 'light') document.documentElement.dataset.theme = 'light';
})();

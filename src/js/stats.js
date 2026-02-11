import { API_BASE, CARD_REPOS, OWNER } from '../main.js';
import { cachedFetchJSON, renderError, animateCounter } from './api.js';

function showStats({ loc, commits }) {
  animateCounter(document.getElementById('total-loc'), loc);
  animateCounter(document.getElementById('total-commits'), commits);
}

async function loadStats() {
  const statsBar = document.querySelector('.stats-bar');
  const cacheKey = 'nd_stats';
  const cacheTTL = 30 * 60 * 1000;
  const locEl = document.getElementById('total-loc');
  const commitsEl = document.getElementById('total-commits');

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < cacheTTL) {
      showStats(cached.data);
      return;
    }
  } catch { /* ignore */ }

  try {
    const langResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${r}/languages`).then(res => res.data).catch(() => ({})))
    );

    const totalBytes = langResults.reduce((sum, lang) => sum + Object.values(lang).reduce((a, b) => a + b, 0), 0);
    const loc = Math.round(totalBytes / 40);

    const contribResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${r}/contributors`).then(res => res.data).catch(() => []))
    );
    const commits = contribResults.reduce((sum, contribs) =>
      sum + (Array.isArray(contribs) ? contribs.reduce((a, c) => a + c.contributions, 0) : 0), 0);

    const data = { loc, commits };
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    showStats(data);
  } catch (err) {
    locEl.classList.remove('shimmer-placeholder');
    commitsEl.classList.remove('shimmer-placeholder');
    renderError(statsBar, err.message || 'Failed to load stats', () => {
      statsBar.innerHTML = `
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-loc">&nbsp;</span><span class="stat-label">Lines of Code</span></div>
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-commits">&nbsp;</span><span class="stat-label">Commits</span></div>
        <div class="stat"><span class="stat-value" id="total-projects">5</span><span class="stat-label">Projects</span></div>`;
      loadStats();
    });
  }
}

export function init() {
  const statsBar = document.querySelector('.stats-bar');
  let statsLoaded = false;
  const statsObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !statsLoaded) {
      statsLoaded = true;
      statsObserver.unobserve(statsBar);
      loadStats();
    }
  }, { rootMargin: '200px' });
  statsObserver.observe(statsBar);
}

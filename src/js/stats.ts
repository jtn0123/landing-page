import { API_BASE, CARD_REPOS, OWNER } from '../main.ts';
import { cachedFetchJSON, renderError, animateCounter } from './api.ts';
import type { LanguageData, ContributorData, StatsData, CacheEntry } from './types.ts';

function showStats({ loc, commits }: StatsData): void {
  const locEl = document.getElementById('total-loc');
  const commitsEl = document.getElementById('total-commits');
  if (locEl) animateCounter(locEl, loc);
  if (commitsEl) animateCounter(commitsEl, commits);
}

async function loadStats(): Promise<void> {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;
  const cacheKey = 'nd_stats';
  const cacheTTL = 30 * 60 * 1000;
  const locEl = document.getElementById('total-loc');
  const commitsEl = document.getElementById('total-commits');

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const cached: CacheEntry<StatsData> = JSON.parse(raw);
      if (cached && Date.now() - cached.ts < cacheTTL) {
        showStats(cached.data);
        return;
      }
    }
  } catch { /* ignore */ }

  try {
    const langResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON<LanguageData>(`${API_BASE}/repos/${OWNER}/${r}/languages`).then(res => res.data).catch(() => ({} as LanguageData)))
    );

    const totalBytes = langResults.reduce((sum, lang) => sum + Object.values(lang).reduce((a, b) => a + b, 0), 0);
    const loc = Math.round(totalBytes / 40);

    const contribResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON<ContributorData[]>(`${API_BASE}/repos/${OWNER}/${r}/contributors`).then(res => res.data).catch(() => [] as ContributorData[]))
    );
    const commits = contribResults.reduce((sum, contribs) =>
      sum + (Array.isArray(contribs) ? contribs.reduce((a, c) => a + c.contributions, 0) : 0), 0);

    const data: StatsData = { loc, commits };
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data }));
    showStats(data);
  } catch (err) {
    if (locEl) locEl.classList.remove('shimmer-placeholder');
    if (commitsEl) commitsEl.classList.remove('shimmer-placeholder');
    renderError(statsBar, (err as Error).message || 'Failed to load stats', () => {
      statsBar.innerHTML = `
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-loc">&nbsp;</span><span class="stat-label">Lines of Code</span></div>
        <div class="stat"><span class="stat-value shimmer-placeholder" id="total-commits">&nbsp;</span><span class="stat-label">Commits</span></div>
        <div class="stat"><span class="stat-value" id="total-projects">5</span><span class="stat-label">Projects</span></div>`;
      loadStats();
    });
  }
}

export function init(): void {
  const statsBar = document.querySelector('.stats-bar');
  if (!statsBar) return;
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

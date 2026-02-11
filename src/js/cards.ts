import { API_BASE, OWNER } from '../main.ts';
import { cachedFetchJSON, renderError, relativeTime } from './api.ts';
import type { RepoData, WorkflowResponse, ParticipationData, LanguageData } from './types.ts';

const HEATMAP_COLORS: Record<string, string> = {
  MegaBonk: '79,195,247',
  VoltTracker: '76,175,80',
  'landing-page': '171,71,188',
  satellite_processor: '255,152,0',
  AudioWhisper: '233,30,99',
};

const LANG_COLORS: Record<string, string> = {
  TypeScript: '#3178c6',
  JavaScript: '#f1e05a',
  Python: '#3572A5',
  CSS: '#563d7c',
  HTML: '#e34c26',
  Shell: '#89e051',
  PLpgSQL: '#336790',
};

async function loadCardMeta(): Promise<void> {
  const cards = document.querySelectorAll('.card[data-repo]');
  await Promise.all(
    [...cards].map(async (card) => {
      const repo = (card as HTMLElement).dataset.repo;
      if (!repo) return;
      try {
        const { data } = await cachedFetchJSON<RepoData>(`${API_BASE}/repos/${OWNER}/${repo}`);
        const updatedEl = card.querySelector('.card-updated');
        if (updatedEl && data.pushed_at) {
          updatedEl.textContent = 'Updated ' + relativeTime(data.pushed_at);
        }
        // Star/fork badges — only show when count > 0
        if (updatedEl) {
          const stars = data.stargazers_count ?? 0;
          const forks = data.forks_count ?? 0;
          if (stars > 0 || forks > 0) {
            const badgesContainer = document.createElement('div');
            badgesContainer.className = 'card-meta-badges';
            if (stars > 0) {
              const starsEl = document.createElement('span');
              starsEl.className = 'card-meta-badge';
              starsEl.textContent = `⭐ ${stars}`;
              starsEl.setAttribute('aria-label', `${stars} stars`);
              badgesContainer.appendChild(starsEl);
            }
            if (forks > 0) {
              const forksEl = document.createElement('span');
              forksEl.className = 'card-meta-badge';
              forksEl.textContent = `🔀 ${forks}`;
              forksEl.setAttribute('aria-label', `${forks} forks`);
              badgesContainer.appendChild(forksEl);
            }
            updatedEl.after(badgesContainer);
          }
        }
      } catch {
        /* ignore */
      }
      try {
        const { data } = await cachedFetchJSON<WorkflowResponse>(
          `${API_BASE}/repos/${OWNER}/${repo}/actions/runs?per_page=1`,
        );
        if (data.workflow_runs && data.workflow_runs.length > 0) {
          const run = data.workflow_runs[0];
          const h2 = card.querySelector('h2');
          if (!h2) return;
          const badge = document.createElement('span');
          badge.className = 'ci-badge';
          if (run.conclusion === 'success') {
            badge.classList.add('ci-success');
            badge.textContent = '✓';
          } else if (run.conclusion === 'failure') {
            badge.classList.add('ci-failure');
            badge.textContent = '✗';
          }
          if (badge.textContent) h2.insertBefore(badge, h2.querySelector('.subtitle'));
        }
      } catch {
        /* ignore */
      }
    }),
  );
}

async function loadHeatmaps(): Promise<void> {
  const rows = document.querySelectorAll('.heatmap-row[data-repo]');
  for (const row of rows) {
    const repo = (row as HTMLElement).dataset.repo;
    if (!repo) continue;
    const rgb = HEATMAP_COLORS[repo] || '79,195,247';
    try {
      const { data } = await cachedFetchJSON<ParticipationData>(
        `${API_BASE}/repos/${OWNER}/${repo}/stats/participation`,
      );
      const weeks = (data.owner || data.all || []).slice(-12);
      const max = Math.max(...weeks, 1);
      row.innerHTML = '';
      weeks.forEach((count, idx) => {
        const cell = document.createElement('span');
        cell.className = 'heatmap-cell';
        const intensity = count / max;
        if (count === 0) {
          cell.style.background = 'var(--border)';
        } else {
          cell.style.background = `rgba(${rgb},${0.2 + intensity * 0.8})`;
        }
        cell.title = count + ' commit' + (count !== 1 ? 's' : '');
        row.appendChild(cell);
        setTimeout(() => cell.classList.add('active'), 30 * idx);
      });
    } catch {
      /* ignore */
    }
  }
}

async function loadLangBar(el: HTMLElement): Promise<void> {
  const repo = el.dataset.repo;
  if (!repo) return;
  const track = el.querySelector('.lang-bar-track');
  if (!track) return;
  let data: LanguageData | undefined;
  try {
    const result = await cachedFetchJSON<LanguageData>(`${API_BASE}/repos/${repo}/languages`);
    data = result.data;
  } catch (err) {
    track.classList.remove('shimmer-track');
    renderError(el, (err as Error).message || 'Failed to load languages', () => {
      el.innerHTML =
        '<div class="lang-bar-track shimmer-track"><div class="lang-bar-fill"></div></div><div class="lang-legend"></div>';
      loadLangBar(el);
    });
    return;
  }
  track.classList.remove('shimmer-track');
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return;
  const totalLoc = Math.round(total / 40);
  const langs = Object.entries(data)
    .map(([name, bytes]) => ({ name, pct: (bytes / total) * 100, lines: Math.round(bytes / 40) }))
    .filter((l) => l.pct > 2);

  const fill = el.querySelector('.lang-bar-fill') as HTMLElement | null;
  if (!fill) return;
  fill.innerHTML = '';
  fill.style.display = 'flex';
  const segElements: { seg: HTMLElement; pct: number }[] = [];
  langs.forEach((l) => {
    const seg = document.createElement('span');
    seg.style.width = '0%';
    seg.style.background = LANG_COLORS[l.name] || '#888';
    seg.style.position = 'relative';
    seg.addEventListener('mouseenter', () => {
      const tip = document.createElement('div');
      tip.className = 'lang-tooltip';
      tip.textContent = `${l.name}: ${l.pct.toFixed(1)}% · ${l.lines.toLocaleString()} lines`;
      seg.appendChild(tip);
      const rect = tip.getBoundingClientRect();
      if (rect.left < 0) tip.style.transform = `translateX(${-rect.left + 4}px)`;
      if (rect.right > window.innerWidth)
        tip.style.transform = `translateX(${window.innerWidth - rect.right - 4}px)`;
    });
    seg.addEventListener('mouseleave', () => {
      const tip = seg.querySelector('.lang-tooltip');
      if (tip) tip.remove();
    });
    fill.appendChild(seg);
    segElements.push({ seg, pct: l.pct });
  });
  requestAnimationFrame(() => {
    setTimeout(() => {
      segElements.forEach(({ seg, pct }) => {
        seg.style.width = pct + '%';
      });
    }, 50);
  });

  const legend = el.querySelector('.lang-legend');
  if (!legend) return;
  legend.innerHTML =
    '<span class="lang-total">' +
    totalLoc.toLocaleString() +
    ' lines</span>' +
    langs
      .slice(0, 4)
      .map(
        (l) =>
          '<span class="lang-legend-item"><span class="lang-dot" style="background:' +
          (LANG_COLORS[l.name] || '#888') +
          '"></span>' +
          l.name +
          ' ' +
          l.pct.toFixed(1) +
          '%</span>',
      )
      .join('');
}

export function init(): void {
  loadCardMeta();
  loadHeatmaps();

  // Lazy lang bars
  const langObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          langObserver.unobserve(e.target);
          loadLangBar(e.target as HTMLElement);
        }
      });
    },
    { rootMargin: '200px' },
  );
  document.querySelectorAll('.lang-bar').forEach((el) => langObserver.observe(el));
}

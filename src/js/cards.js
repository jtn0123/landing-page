import { API_BASE, OWNER } from '../main.js';
import { cachedFetchJSON, renderError, relativeTime } from './api.js';

const HEATMAP_COLORS = {
  MegaBonk: '79,195,247',
  VoltTracker: '76,175,80',
  'landing-page': '171,71,188',
  'satellite_processor': '255,152,0',
  'AudioWhisper': '233,30,99'
};

const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051', PLpgSQL: '#336790'
};

async function loadCardMeta() {
  const cards = document.querySelectorAll('.card[data-repo]');
  await Promise.all([...cards].map(async (card) => {
    const repo = card.dataset.repo;
    try {
      const { data } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${repo}`);
      const updatedEl = card.querySelector('.card-updated');
      if (updatedEl && data.pushed_at) {
        updatedEl.textContent = 'Updated ' + relativeTime(data.pushed_at);
      }
    } catch { /* ignore */ }
    try {
      const { data } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${repo}/actions/runs?per_page=1`);
      if (data.workflow_runs && data.workflow_runs.length > 0) {
        const run = data.workflow_runs[0];
        const h2 = card.querySelector('h2');
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
    } catch { /* ignore */ }
  }));
}

async function loadHeatmaps() {
  const rows = document.querySelectorAll('.heatmap-row[data-repo]');
  for (const row of rows) {
    const repo = row.dataset.repo;
    const rgb = HEATMAP_COLORS[repo] || '79,195,247';
    try {
      const { data } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${repo}/stats/participation`);
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
    } catch { /* ignore */ }
  }
}

async function loadLangBar(el) {
  const repo = el.dataset.repo;
  const track = el.querySelector('.lang-bar-track');
  let data;
  try {
    const cacheKey = 'nd_lang_' + repo;
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < 600000) { data = cached.data; }
  } catch { /* ignore */ }
  if (!data) {
    try {
      const result = await cachedFetchJSON(`${API_BASE}/repos/${repo}/languages`);
      data = result.data;
    } catch (err) {
      track.classList.remove('shimmer-track');
      renderError(el, err.message || 'Failed to load languages', () => {
        el.innerHTML = '<div class="lang-bar-track shimmer-track"><div class="lang-bar-fill"></div></div><div class="lang-legend"></div>';
        loadLangBar(el);
      });
      return;
    }
  }
  track.classList.remove('shimmer-track');
  const total = Object.values(data).reduce((a, b) => a + b, 0);
  if (!total) return;
  const totalLoc = Math.round(total / 40);
  const langs = Object.entries(data)
    .map(([name, bytes]) => ({ name, pct: (bytes / total) * 100, lines: Math.round(bytes / 40) }))
    .filter(l => l.pct > 2);

  const fill = el.querySelector('.lang-bar-fill');
  fill.innerHTML = '';
  fill.style.display = 'flex';
  const segElements = [];
  langs.forEach(l => {
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
      if (rect.right > window.innerWidth) tip.style.transform = `translateX(${window.innerWidth - rect.right - 4}px)`;
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
      segElements.forEach(({ seg, pct }) => { seg.style.width = pct + '%'; });
    }, 50);
  });

  const legend = el.querySelector('.lang-legend');
  legend.innerHTML = '<span class="lang-total">' + totalLoc.toLocaleString() + ' lines</span>' +
    langs.slice(0, 4).map(l =>
    '<span class="lang-legend-item"><span class="lang-dot" style="background:' +
    (LANG_COLORS[l.name] || '#888') + '"></span>' + l.name + ' ' +
    l.pct.toFixed(1) + '%</span>'
  ).join('');
}

function initCardDots() {
  const projects = document.querySelector('.projects');
  const dots = document.querySelectorAll('.card-dot');
  const cards = projects.querySelectorAll('.card');
  if (!dots.length || !cards.length) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const idx = [...cards].indexOf(entry.target);
        dots.forEach((d, i) => d.classList.toggle('active', i === idx));
      }
    });
  }, { root: projects, threshold: 0.5 });

  cards.forEach(card => observer.observe(card));
}

export function init() {
  loadCardMeta();
  loadHeatmaps();
  initCardDots();

  // Lazy lang bars
  const langObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        langObserver.unobserve(e.target);
        loadLangBar(e.target);
      }
    });
  }, { rootMargin: '200px' });
  document.querySelectorAll('.lang-bar').forEach(el => langObserver.observe(el));
}

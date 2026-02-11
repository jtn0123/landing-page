import { API_BASE, REPOS, OWNER } from '../main.js';
import { cachedFetchJSON, renderError, abbreviateNum, relativeTime } from './api.js';

function truncate(str, len) {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function renderTimeline(commits) {
  const timelineEl = document.getElementById('timeline');
  if (!commits.length) {
    timelineEl.innerHTML = '<p class="timeline-empty">No recent activity</p>';
    return;
  }

  const loading = timelineEl.querySelector('.timeline-loading');
  if (loading) {
    loading.classList.add('skeleton-fade', 'fade-out');
    setTimeout(() => {
      buildTimeline(commits, timelineEl);
    }, 400);
  } else {
    buildTimeline(commits, timelineEl);
  }
}

function buildTimeline(commits, timelineEl) {
  timelineEl.innerHTML = '<div class="timeline-line"></div>' +
    commits.map((c, i) => {
      const firstLine = c.message.split('\n')[0];
      const truncated = truncate(firstLine, 60);
      const isExpandable = truncated !== firstLine;
      return `
      <div class="timeline-item ${i % 2 === 0 ? 'left' : 'right'} content-fade-in" role="listitem">
        <div class="timeline-dot"></div>
        <a href="${c.url || '#'}" target="_blank" rel="noopener noreferrer" class="timeline-content timeline-link">
          <p class="commit-msg${isExpandable ? ' expandable' : ''}" ${isExpandable ? `data-full="${firstLine.replace(/"/g, '&quot;')}" data-short="${truncated.replace(/"/g, '&quot;')}"` : ''}>${truncated}</p>
          <div class="commit-meta">
            <span class="repo-badge repo-${c.repo.toLowerCase()}">${c.repo}</span>
            ${c.additions !== null ? `<span class="stat-add">+${abbreviateNum(c.additions)}</span>` : ''}
            ${c.deletions !== null ? `<span class="stat-del">-${abbreviateNum(c.deletions)}</span>` : ''}
            <span class="commit-time">${relativeTime(c.date)}</span>
          </div>
        </a>
      </div>
    `;}).join('');

  timelineEl.querySelectorAll('.commit-msg.expandable').forEach(msg => {
    msg.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const isExpanded = msg.dataset.expanded === 'true';
      msg.textContent = isExpanded ? msg.dataset.short : msg.dataset.full;
      msg.dataset.expanded = isExpanded ? 'false' : 'true';
    });
  });
}

async function loadTimeline() {
  const timelineEl = document.getElementById('timeline');
  const cacheKey = 'nd_commits';
  const cacheTTL = 30 * 60 * 1000;

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < cacheTTL) {
      renderTimeline(cached.data);
      return;
    }
  } catch { /* ignore */ }

  try {
    const repoCommits = await Promise.all(
      REPOS.map(async (repo) => {
        try {
          const { data } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${repo}/commits?per_page=5`);
          return data.map(c => ({
            message: c.commit.message,
            date: c.commit.committer.date,
            author: c.commit.author.name,
            avatar: c.author?.avatar_url || '',
            repo,
            url: c.html_url,
            sha: c.sha
          }));
        } catch { return []; }
      })
    );

    const commits = repoCommits.flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    if (!commits.length) throw new Error('API error');

    await Promise.all(commits.map(async (c) => {
      try {
        const { data: detail } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${c.repo}/commits/${c.sha}`);
        c.additions = detail.stats?.additions || 0;
        c.deletions = detail.stats?.deletions || 0;
      } catch { /* ignore */ }
    }));

    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: commits }));
    renderTimeline(commits);
  } catch (err) {
    renderError(timelineEl, err.message || 'Unable to load recent activity', () => {
      timelineEl.innerHTML = '<div class="timeline-loading"><div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
      loadTimeline();
    });
  }
}

export function init() {
  const timelineSection = document.getElementById('activity');
  let timelineLoaded = false;
  const timelineObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !timelineLoaded) {
      timelineLoaded = true;
      timelineObserver.unobserve(timelineSection);
      loadTimeline();
    }
  }, { rootMargin: '200px' });
  timelineObserver.observe(timelineSection);
}

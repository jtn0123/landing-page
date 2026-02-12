import { API_BASE, REPOS, OWNER } from '../main.ts';
import { cachedFetchJSON, renderError, abbreviateNum, relativeTime } from './api.ts';
import type { Commit, GitHubCommitResponse, CommitDetailResponse, CacheEntry } from './types.ts';

function truncate(str: string, len: number): string {
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function renderTimeline(commits: Commit[]): void {
  const timelineEl = document.getElementById('timeline');
  if (!timelineEl) return;
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

/**
 * Render a chronological commit activity timeline into the given container element.
 *
 * Builds the timeline markup from `commits`, injects it into `timelineEl`, sets
 * `aria-live="polite"` after rendering, and attaches click handlers to toggle
 * commit messages that are longer than 60 characters between short and full text.
 *
 * @param commits - Array of commit objects to display (message, date, repo, url, additions, deletions, etc.)
 * @param timelineEl - The container HTMLElement where the timeline list will be rendered
 */
function buildTimeline(commits: Commit[], timelineEl: HTMLElement): void {
  // Add aria-live after content is built so screen readers don't announce all items on load
  requestAnimationFrame(() => timelineEl.setAttribute('aria-live', 'polite'));
  timelineEl.innerHTML =
    '<div class="timeline-line"></div>' +
    commits
      .map((c, i) => {
        const firstLine = c.message.split('\n')[0];
        const truncated = truncate(firstLine, 60);
        const isExpandable = truncated !== firstLine;
        return `
      <li class="timeline-item ${i % 2 === 0 ? 'left' : 'right'} content-fade-in">
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
      </li>
    `;
      })
      .join('');

  timelineEl.querySelectorAll('.commit-msg.expandable').forEach((msg) => {
    msg.addEventListener('click', (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      const el = msg as HTMLElement;
      const isExpanded = el.dataset.expanded === 'true';
      el.textContent = isExpanded ? el.dataset.short! : el.dataset.full!;
      el.dataset.expanded = isExpanded ? 'false' : 'true';
    });
  });
}

async function loadTimeline(): Promise<void> {
  const timelineEl = document.getElementById('timeline');
  if (!timelineEl) return;
  const cacheKey = 'nd_commits';
  const cacheTTL = 30 * 60 * 1000;

  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const cached: CacheEntry<Commit[]> = JSON.parse(raw);
      if (cached && Date.now() - cached.ts < cacheTTL) {
        renderTimeline(cached.data);
        return;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const repoCommits = await Promise.all(
      REPOS.map(async (repo) => {
        try {
          const { data } = await cachedFetchJSON<GitHubCommitResponse[]>(
            `${API_BASE}/repos/${OWNER}/${repo}/commits?per_page=5`,
          );
          return data.map((c) => ({
            message: c.commit.message,
            date: c.commit.committer.date,
            author: c.commit.author.name,
            avatar: c.author?.avatar_url || '',
            repo,
            url: c.html_url,
            sha: c.sha,
            additions: null as number | null,
            deletions: null as number | null,
          }));
        } catch {
          return [] as Commit[];
        }
      }),
    );

    const commits = repoCommits
      .flat()
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    if (!commits.length) throw new Error('API error');

    await Promise.all(
      commits.map(async (c) => {
        try {
          const { data: detail } = await cachedFetchJSON<CommitDetailResponse>(
            `${API_BASE}/repos/${OWNER}/${c.repo}/commits/${c.sha}`,
          );
          c.additions = detail.stats?.additions || 0;
          c.deletions = detail.stats?.deletions || 0;
        } catch {
          /* ignore */
        }
      }),
    );

    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: commits }));
    renderTimeline(commits);
  } catch (err) {
    renderError(timelineEl, (err as Error).message || 'Unable to load recent activity', () => {
      timelineEl.innerHTML =
        '<div class="timeline-loading"><div class="skeleton-item"></div><div class="skeleton-item"></div><div class="skeleton-item"></div></div>';
      loadTimeline();
    });
  }
}

export function init(): void {
  const timelineSection = document.getElementById('activity');
  if (!timelineSection) return;
  let timelineLoaded = false;
  const timelineObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !timelineLoaded) {
        timelineLoaded = true;
        timelineObserver.unobserve(timelineSection);
        loadTimeline();
      }
    },
    { rootMargin: '200px' },
  );
  timelineObserver.observe(timelineSection);
}
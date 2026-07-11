/**
 * Also Active section — auto-discovers repos pushed in the last 3 months
 * that aren't already featured as project cards.
 * @module active-repos
 */
import { API_BASE, OWNER, REPOS } from './constants.ts';
import { cachedFetchJSON, relativeTime, escapeHTML } from './api.ts';
import { LANG_COLORS } from './cards.ts';
import type { UserRepo } from './types.ts';

/** Repos count as "actively maintained" if pushed within this many days. */
const ACTIVE_WINDOW_DAYS = 90;

/** Filter the full repo list down to active, non-featured repos. */
export function selectActiveRepos(repos: UserRepo[], now: number = Date.now()): UserRepo[] {
  const cutoff = now - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return repos
    .filter(
      (r) =>
        !r.archived &&
        !REPOS.includes(r.name) &&
        r.pushed_at &&
        new Date(r.pushed_at).getTime() >= cutoff,
    )
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
}

function renderRepoCard(repo: UserRepo): HTMLElement {
  const card = document.createElement('article');
  card.className = 'repo-mini-card fade-in';

  const langDot = repo.language
    ? `<span class="repo-mini-lang"><span class="lang-dot" style="background:${
        LANG_COLORS[repo.language] || '#888'
      }"></span>${escapeHTML(repo.language)}</span>`
    : '';
  const stars =
    repo.stargazers_count > 0
      ? `<span aria-label="${repo.stargazers_count} stars">⭐ ${repo.stargazers_count}</span>`
      : '';
  const forkBadge = repo.fork ? '<span class="repo-mini-fork-badge">Fork</span>' : '';
  const homepage = repo.homepage
    ? `<a href="${escapeHTML(repo.homepage)}" class="repo-mini-link" target="_blank" rel="noopener noreferrer">Live ↗</a>`
    : '';

  card.innerHTML = `
    <h3>
      <a href="${escapeHTML(repo.html_url)}" target="_blank" rel="noopener noreferrer">${escapeHTML(repo.name)}</a>
      ${forkBadge}
    </h3>
    <p class="repo-mini-desc">${escapeHTML(repo.description || 'No description yet.')}</p>
    <div class="repo-mini-meta">
      ${langDot}
      ${stars}
      <span>Updated ${relativeTime(repo.pushed_at)}</span>
      ${homepage}
    </div>`;
  return card;
}

async function loadActiveRepos(): Promise<void> {
  const section = document.getElementById('also-active');
  const grid = document.getElementById('also-active-grid');
  if (!section || !grid) return;

  let repos: UserRepo[];
  try {
    const { data } = await cachedFetchJSON<UserRepo[]>(
      `${API_BASE}/users/${OWNER}/repos?sort=pushed&per_page=100`,
    );
    repos = Array.isArray(data) ? data : [];
  } catch (err) {
    console.warn('[active-repos] Failed to load repo list:', err);
    return;
  }

  const active = selectActiveRepos(repos);
  if (active.length === 0) return;

  grid.innerHTML = '';
  active.forEach((repo, idx) => {
    const card = renderRepoCard(repo);
    card.style.setProperty('--fade-delay', `${idx * 80}ms`);
    grid.appendChild(card);
    requestAnimationFrame(() => card.classList.add('visible'));
  });
  section.hidden = false;

  // Reflect the true project count now that we know it.
  const totalEl = document.getElementById('total-projects');
  if (totalEl) totalEl.textContent = String(REPOS.length + active.length);
}

/** Initialize the Also Active section. */
export function init(): void {
  loadActiveRepos();
}

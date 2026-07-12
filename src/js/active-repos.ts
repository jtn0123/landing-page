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

/** Repos to never show in the Also Active section, even when recently pushed. */
const EXCLUDED_REPOS = ['Claude-Code-Usage-Monitor', 'RuView'];

/** Fetch the full public repo list (cached alongside other API calls). */
export async function fetchUserRepos(): Promise<UserRepo[]> {
  const { data } = await cachedFetchJSON<UserRepo[]>(
    `${API_BASE}/users/${OWNER}/repos?sort=pushed&per_page=100`,
  );
  return Array.isArray(data) ? data : [];
}

/**
 * All repo names the site aggregates over: featured repos plus every
 * auto-discovered active repo. Falls back to just the featured list when
 * the repo listing is unavailable.
 */
export async function getAllProjectRepoNames(): Promise<string[]> {
  try {
    const active = selectActiveRepos(await fetchUserRepos());
    return [...REPOS, ...active.map((r) => r.name)];
  } catch {
    return [...REPOS];
  }
}

/** Filter the full repo list down to active, non-featured repos. */
export function selectActiveRepos(repos: UserRepo[], now: number = Date.now()): UserRepo[] {
  const cutoff = now - ACTIVE_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return repos
    .filter(
      (r) =>
        !r.archived &&
        !REPOS.includes(r.name) &&
        !EXCLUDED_REPOS.includes(r.name) &&
        r.pushed_at &&
        new Date(r.pushed_at).getTime() >= cutoff,
    )
    .sort((a, b) => new Date(b.pushed_at).getTime() - new Date(a.pushed_at).getTime());
}

function renderRepoCard(repo: UserRepo): HTMLElement {
  const card = document.createElement('article');
  card.className = 'repo-mini-card fade-in';
  if (repo.language) card.dataset.lang = repo.language;

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
    repos = await fetchUserRepos();
  } catch (err) {
    console.warn('[active-repos] Failed to load repo list:', err);
    section.hidden = true;
    return;
  }

  const active = selectActiveRepos(repos);
  if (active.length === 0) {
    section.hidden = true;
    return;
  }

  // Stagger cards in as they scroll into view, matching the rest of the page.
  const cardObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          cardObserver.unobserve(e.target);
        }
      }
    },
    { threshold: 0.15 },
  );

  grid.innerHTML = '';
  active.forEach((repo, idx) => {
    const card = renderRepoCard(repo);
    card.style.setProperty('--fade-delay', `${(idx % 2) * 120}ms`);
    grid.appendChild(card);
    cardObserver.observe(card);
  });

  // Reflect the true project count now that we know it.
  const totalEl = document.getElementById('total-projects');
  if (totalEl) totalEl.textContent = String(REPOS.length + active.length);
}

/** Initialize the Also Active section. */
export function init(): void {
  loadActiveRepos();
}

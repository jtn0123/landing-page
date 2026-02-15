/**
 * Technology filter pills — filter project cards by tech stack.
 * @module filter
 */

const FILTER_TAGS = ['All', 'TypeScript', 'Python', 'Docker', 'React', 'Swift'] as const;

/** Initialize the filter bar and attach click handlers. */
export function init(): void {
  const main = document.getElementById('main-content');
  if (!main) return;

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.role = 'toolbar';
  filterBar.ariaLabel = 'Filter projects by technology';

  FILTER_TAGS.forEach((tag) => {
    const pill = document.createElement('button');
    pill.className = 'filter-pill';
    pill.textContent = tag;
    pill.dataset.filter = tag;
    if (tag === 'All') {
      pill.classList.add('active');
      pill.setAttribute('aria-pressed', 'true');
    } else {
      pill.setAttribute('aria-pressed', 'false');
    }
    pill.addEventListener('click', () => filterCards(tag, filterBar));
    filterBar.appendChild(pill);
  });

  main.parentNode?.insertBefore(filterBar, main);
}

function filterCards(tag: string, filterBar: HTMLElement): void {
  filterBar.querySelectorAll('.filter-pill').forEach((p) => {
    const isActive = (p as HTMLElement).dataset.filter === tag;
    p.classList.toggle('active', isActive);
    p.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  const cards = document.querySelectorAll<HTMLElement>('.card');
  cards.forEach((card) => {
    const techs = card.querySelectorAll('.tech span');
    const techNames = [...techs].map((t) => t.textContent?.trim() ?? '');
    const matches = tag === 'All' || techNames.includes(tag);

    if (matches) {
      card.classList.remove('filter-hidden');
      card.classList.add('filter-visible');
    } else {
      card.classList.remove('filter-visible');
      card.classList.add('filter-hidden');
    }
  });
}

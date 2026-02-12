const FILTER_TAGS = ['All', 'TypeScript', 'Python', 'Docker', 'React', 'Swift'] as const;

/**
 * Builds a filter toolbar of technology tags and inserts it before the element with id "main-content".
 *
 * Creates a toolbar element with a button for each tag in `FILTER_TAGS`, marks the "All" tag active,
 * attaches click handlers that invoke `filterCards` with the selected tag, and inserts the toolbar
 * immediately before the main content element when present.
 */
export function init(): void {
  const main = document.getElementById('main-content');
  if (!main) return;

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.setAttribute('role', 'toolbar');
  filterBar.setAttribute('aria-label', 'Filter projects by technology');

  FILTER_TAGS.forEach((tag) => {
    const pill = document.createElement('button');
    pill.className = 'filter-pill';
    pill.textContent = tag;
    pill.dataset.filter = tag;
    if (tag === 'All') pill.classList.add('active');
    pill.addEventListener('click', () => filterCards(tag, filterBar));
    filterBar.appendChild(pill);
  });

  main.parentNode?.insertBefore(filterBar, main);
}

/**
 * Update the filter toolbar's active pill and show or hide cards to match the selected tag.
 *
 * When `tag` is "All", all cards are shown. Otherwise, cards that contain a matching technology
 * label are shown by adding `filter-visible` and removing `filter-hidden`; non-matching cards
 * receive `filter-hidden` and have `filter-visible` removed. The corresponding pill in
 * `filterBar` receives the `active` class.
 *
 * @param tag - The selected filter tag label
 * @param filterBar - The toolbar element that contains the filter pill elements
 */
function filterCards(tag: string, filterBar: HTMLElement): void {
  filterBar.querySelectorAll('.filter-pill').forEach((p) => {
    p.classList.toggle('active', (p as HTMLElement).dataset.filter === tag);
  });

  const cards = document.querySelectorAll<HTMLElement>('.card');
  cards.forEach((card) => {
    const techs = card.querySelectorAll('.tech span');
    const techNames = [...techs].map((t) => t.textContent?.trim() ?? '');
    const matches = tag === 'All' || techNames.some((t) => t === tag);

    if (matches) {
      card.classList.remove('filter-hidden');
      card.classList.add('filter-visible');
    } else {
      card.classList.remove('filter-visible');
      card.classList.add('filter-hidden');
    }
  });
}
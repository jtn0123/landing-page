// --- API base URL (proxied via Cloudflare Worker with 5-min cache) ---
const API_BASE = '/api/github';
const REPOS = ['MegaBonk', 'VoltTracker', 'landing-page', 'satallite_processor', 'AudioWhisper'];
const CARD_REPOS = ['MegaBonk', 'VoltTracker', 'satallite_processor', 'AudioWhisper'];
const OWNER = 'jtn0123';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = window.matchMedia('(max-width: 720px)').matches;

// --- Feature 1: Theme toggle ---
const themeBtn = document.getElementById('theme-toggle');
function getTheme() {
  return localStorage.getItem('theme') || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}
function applyTheme(t) {
  if (t === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    themeBtn.textContent = '☀️';
  } else {
    document.documentElement.removeAttribute('data-theme');
    themeBtn.textContent = '🌙';
  }
}
applyTheme(getTheme());
themeBtn.addEventListener('click', () => {
  const next = getTheme() === 'dark' ? 'light' : 'dark';
  localStorage.setItem('theme', next);
  applyTheme(next);
});

// --- Feature 6: Smooth scroll nav ---
document.querySelectorAll('[data-scroll]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

// --- Sticky header ---
const header = document.getElementById('site-header');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 40);
}, { passive: true });

// --- Fade-in on scroll ---
const fadeEls = document.querySelectorAll('.fade-in');
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObserver.unobserve(e.target);
    }
  });
}, { threshold: 0.15 });
fadeEls.forEach(el => fadeObserver.observe(el));

// --- Keyboard nav for cards ---
document.querySelectorAll('.card[data-link]').forEach(card => {
  card.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      const link = card.querySelector('.btn-primary');
      if (link) link.click();
    }
  });
});

// --- Lightbox ---
const lightbox = document.getElementById('lightbox');
const lightboxImg = document.getElementById('lightbox-img');
document.querySelectorAll('.lightbox-trigger').forEach(img => {
  img.style.cursor = 'zoom-in';
  img.addEventListener('click', e => {
    e.preventDefault();
    e.stopPropagation();
    lightboxImg.src = img.src;
    lightboxImg.alt = img.alt;
    lightbox.classList.add('active');
  });
});
lightbox.addEventListener('click', () => lightbox.classList.remove('active'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') lightbox.classList.remove('active');
});

// --- Carousel with swipe + Ken Burns ---
document.querySelectorAll('.carousel').forEach(carousel => {
  const slides = carousel.querySelectorAll('.carousel-slide');
  const dots = carousel.querySelectorAll('.dot');
  if (slides.length < 2) return;

  let current = 0;
  let paused = false;
  const interval = parseInt(carousel.dataset.interval) || 4000;

  function applyKenBurns(idx) {
    if (reducedMotion) return;
    slides.forEach(s => s.classList.remove('kb-zoom'));
    slides[idx].classList.add('kb-zoom');
  }

  function goTo(idx) {
    slides[current].classList.remove('active', 'kb-zoom');
    dots[current].classList.remove('active');
    current = ((idx % slides.length) + slides.length) % slides.length;
    slides[current].classList.add('active');
    dots[current].classList.add('active');
    applyKenBurns(current);
  }

  applyKenBurns(0);

  carousel.addEventListener('mouseenter', () => paused = true);
  carousel.addEventListener('mouseleave', () => paused = false);

  dots.forEach((dot, i) => {
    dot.addEventListener('click', e => { e.stopPropagation(); goTo(i); });
  });

  const timer = setInterval(() => { if (!paused) goTo(current + 1); }, interval);
  if (reducedMotion) clearInterval(timer);

  // Feature 3: Swipe support
  let touchStartX = 0, touchStartY = 0, swiping = false;
  carousel.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
    swiping = true;
  }, { passive: true });
  carousel.addEventListener('touchmove', e => {
    if (!swiping) return;
    const dy = Math.abs(e.touches[0].clientY - touchStartY);
    const dx = Math.abs(e.touches[0].clientX - touchStartX);
    if (dy > dx) swiping = false;
  }, { passive: true });
  carousel.addEventListener('touchend', e => {
    if (!swiping) return;
    const diff = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(diff) > 50) {
      goTo(diff < 0 ? current + 1 : current - 1);
    }
    swiping = false;
  }, { passive: true });
});

// --- Feature 7: Card parallax tilt (desktop only) ---
if (!isMobile && !reducedMotion) {
  document.querySelectorAll('.card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const rect = card.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      card.style.transform = `perspective(1000px) rotateX(${-y * 6}deg) rotateY(${x * 6}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => {
      card.style.transition = 'transform 0.3s ease';
      card.style.transform = '';
      card.addEventListener('transitionend', () => { card.style.transition = ''; }, { once: true });
    });
  });
}

// --- Shared relativeTime function ---
function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  const days = Math.floor(hrs / 24);
  if (days < 30) return days + 'd ago';
  return Math.floor(days / 30) + 'mo ago';
}

// --- Animated counter (Feature 20: bounce at end) ---
function animateCounter(el, target) {
  el.classList.remove('shimmer-placeholder');
  const duration = 1200;
  const start = performance.now();
  function tick(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(eased * target);
    el.textContent = val.toLocaleString();
    if (progress < 1) {
      requestAnimationFrame(tick);
    } else {
      el.textContent = target.toLocaleString();
      el.classList.add('bounce');
      el.addEventListener('animationend', () => el.classList.remove('bounce'), { once: true });
    }
  }
  requestAnimationFrame(tick);
}

// --- Error / Rate Limit helpers ---
function parseRateLimit(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  if (remaining !== null && parseInt(remaining) === 0 && reset) {
    const resetTime = parseInt(reset) * 1000;
    const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
    return `Rate limited — try again in ${minutes}m`;
  }
  return null;
}

async function fetchJSON(url) {
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) {
    const rateLimitMsg = parseRateLimit(res);
    if (rateLimitMsg) throw new Error(rateLimitMsg);
  }
  if (!res.ok) throw new Error(`API error (${res.status})`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error('Non-JSON response');
  return { data: await res.json(), response: res };
}

function renderError(container, message, retryFn) {
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
      <button class="retry-btn" onclick="this.disabled=true;this.textContent='Retrying…';">Retry</button>
    </div>`;
  container.querySelector('.retry-btn').addEventListener('click', function() {
    retryFn();
  });
}

// --- Shared API data cache (reduces duplicate fetches) ---
const apiCache = {};

async function cachedFetchJSON(url, ttl = 30 * 60 * 1000) {
  const cacheKey = 'api_' + url;
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < ttl) {
      return { data: cached.data };
    }
  } catch {}
  const result = await fetchJSON(url);
  try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result.data })); } catch {}
  return result;
}

// --- Feature 4: Last updated + Feature 17: CI badge ---
async function loadCardMeta() {
  const cards = document.querySelectorAll('.card[data-repo]');
  for (const card of cards) {
    const repo = card.dataset.repo;
    try {
      const { data } = await cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${repo}`);
      const updatedEl = card.querySelector('.card-updated');
      if (updatedEl && data.pushed_at) {
        updatedEl.textContent = 'Updated ' + relativeTime(data.pushed_at);
      }
    } catch {}
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
    } catch {}
  }
}
loadCardMeta();

// --- Feature 16: Contribution heatmap ---
const HEATMAP_COLORS = {
  MegaBonk: '79,195,247',
  VoltTracker: '76,175,80',
  'landing-page': '171,71,188',
  'satallite_processor': '255,152,0',
  'AudioWhisper': '233,30,99'
};

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
    } catch {}
  }
}
loadHeatmaps();

// --- Lazy Stats Loading ---
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

async function loadStats() {
  const cacheKey = 'neuhard_stats';
  const cacheTTL = 30 * 60 * 1000;
  const locEl = document.getElementById('total-loc');
  const commitsEl = document.getElementById('total-commits');

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < cacheTTL) {
      showStats(cached.data);
      return;
    }
  } catch {}

  try {
    const langResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${r}/languages`).then(r => r.data).catch(() => ({})))
    );

    const totalBytes = langResults.reduce((sum, lang) => sum + Object.values(lang).reduce((a, b) => a + b, 0), 0);
    const loc = Math.round(totalBytes / 40);

    const contribResults = await Promise.all(
      CARD_REPOS.map(r => cachedFetchJSON(`${API_BASE}/repos/${OWNER}/${r}/contributors`).then(r => r.data).catch(() => []))
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

function showStats({ loc, commits }) {
  animateCounter(document.getElementById('total-loc'), loc);
  animateCounter(document.getElementById('total-commits'), commits);
}

// --- Lazy Timeline Loading ---
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

async function loadTimeline() {
  const timelineEl = document.getElementById('timeline');
  const cacheKey = 'neuhard_commits';
  const cacheTTL = 30 * 60 * 1000;

  function truncate(str, len) {
    return str.length > len ? str.slice(0, len) + '…' : str;
  }

  function renderTimeline(commits) {
    if (!commits.length) {
      timelineEl.innerHTML = '<p class="timeline-empty">No recent activity</p>';
      return;
    }

    const loading = timelineEl.querySelector('.timeline-loading');
    if (loading) {
      loading.classList.add('skeleton-fade', 'fade-out');
      setTimeout(() => {
        buildTimeline(commits);
      }, 400);
    } else {
      buildTimeline(commits);
    }

    function buildTimeline(commits) {
      timelineEl.innerHTML = '<div class="timeline-line"></div>' +
        commits.map((c, i) => {
          const firstLine = c.message.split('\n')[0];
          const truncated = truncate(firstLine, 60);
          const isExpandable = truncated !== firstLine;
          return `
          <div class="timeline-item ${i % 2 === 0 ? 'left' : 'right'} content-fade-in">
            <div class="timeline-dot"></div>
            <a href="${c.url || '#'}" target="_blank" rel="noopener noreferrer" class="timeline-content timeline-link">
              <p class="commit-msg${isExpandable ? ' expandable' : ''}" ${isExpandable ? `data-full="${firstLine.replace(/"/g, '&quot;')}" data-short="${truncated.replace(/"/g, '&quot;')}"` : ''}>${truncated}</p>
              <div class="commit-meta">
                <span class="repo-badge repo-${c.repo.toLowerCase()}">${c.repo}</span>
                ${c.additions != null ? `<span class="stat-add">+${c.additions}</span>` : ''}
                ${c.deletions != null ? `<span class="stat-del">-${c.deletions}</span>` : ''}
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
  }

  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < cacheTTL) {
      renderTimeline(cached.data);
      return;
    }
  } catch {}

  try {
    const responses = await Promise.all(
      REPOS.map(r => fetch(`${API_BASE}/repos/${OWNER}/${r}/commits?per_page=5`))
    );

    for (const res of responses) {
      if (res.status === 403 || res.status === 429) {
        const msg = parseRateLimit(res);
        if (msg) throw new Error(msg);
      }
    }

    if (responses.every(r => !r.ok)) throw new Error('API error');

    const parse = async (res, repo) => {
      if (!res.ok) return [];
      const data = await res.json();
      return data.map(c => ({
        message: c.commit.message,
        date: c.commit.committer.date,
        author: c.commit.author.name,
        avatar: c.author?.avatar_url || '',
        repo,
        url: c.html_url,
        sha: c.sha
      }));
    };

    const commits = (await Promise.all(
      responses.map((res, i) => parse(res, REPOS[i]))
    )).flat().sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);

    await Promise.all(commits.map(async (c) => {
      try {
        const r = await fetch(`${API_BASE}/repos/${OWNER}/${c.repo}/commits/${c.sha}`);
        if (r.ok) {
          const detail = await r.json();
          c.additions = detail.stats?.additions || 0;
          c.deletions = detail.stats?.deletions || 0;
        }
      } catch {}
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

// --- Language Bars (Feature 2: tooltips) ---
const LANG_COLORS = {
  TypeScript: '#3178c6', JavaScript: '#f1e05a', Python: '#3572A5',
  CSS: '#563d7c', HTML: '#e34c26', Shell: '#89e051', PLpgSQL: '#336790'
};

async function loadLangBar(el) {
  const repo = el.dataset.repo;
  const cacheKey = 'lang_' + repo;
  const track = el.querySelector('.lang-bar-track');
  let data;
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < 600000) { data = cached.data; }
  } catch {}
  if (!data) {
    try {
      const { data: d } = await cachedFetchJSON(`${API_BASE}/repos/${repo}/languages`);
      data = d;
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

const langObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      langObserver.unobserve(e.target);
      loadLangBar(e.target);
    }
  });
}, { rootMargin: '200px' });
document.querySelectorAll('.lang-bar').forEach(el => langObserver.observe(el));

// --- Scroll progress bar ---
const scrollProgress = document.getElementById('scroll-progress');
if (scrollProgress) {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    scrollProgress.style.width = pct + '%';
  }, { passive: true });
}

// --- Parallax background mesh (desktop only) ---
if (!isMobile) {
  const mesh = document.getElementById('parallax-mesh');
  if (mesh) {
    window.addEventListener('scroll', () => {
      mesh.style.transform = `translateY(${window.scrollY * 0.1}px)`;
    }, { passive: true });
  }
}

// --- Pinch-to-zoom on lightbox ---
(function() {
  let initialDist = 0, currentScale = 1;
  function getDist(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
  }
  lightboxImg.addEventListener('touchstart', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      initialDist = getDist(e.touches);
    }
  }, { passive: false });
  lightboxImg.addEventListener('touchmove', e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const dist = getDist(e.touches);
      const scale = Math.min(Math.max(currentScale * (dist / initialDist), 1), 4);
      lightboxImg.style.transform = `scale(${scale})`;
    }
  }, { passive: false });
  lightboxImg.addEventListener('touchend', e => {
    if (e.touches.length < 2) {
      currentScale = parseFloat(lightboxImg.style.transform.replace(/[^0-9.]/g, '') || 1);
      if (isNaN(currentScale) || currentScale < 1) currentScale = 1;
    }
  });
  lightbox.addEventListener('click', () => {
    lightboxImg.style.transform = '';
    currentScale = 1;
  });
})();

// --- Active nav link on scroll ---
(function() {
  const sections = [
    { id: 'main-content', el: document.getElementById('main-content') },
    { id: 'tech-section', el: document.getElementById('tech-section') },
    { id: 'activity', el: document.getElementById('activity') }
  ];
  const navLinks = document.querySelectorAll('.header-nav a[data-scroll]');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(a => {
          a.classList.toggle('active', a.getAttribute('href') === '#' + entry.target.id);
        });
      }
    });
  }, { threshold: 0.2 });
  sections.forEach(s => { if (s.el) sectionObserver.observe(s.el); });
})();

// --- Page exit transition for internal links ---
document.querySelectorAll('.btn-primary').forEach(btn => {
  const url = btn.getAttribute('href');
  if (!url || btn.classList.contains('btn-disabled')) return;
  if (url.includes('neuhard.dev') || url.startsWith('/')) {
    btn.addEventListener('click', e => {
      e.preventDefault();
      document.body.classList.add('page-exit');
      setTimeout(() => { window.location = url; }, 300);
    });
  }
});

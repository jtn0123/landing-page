// --- API helpers ---

export function abbreviateNum(n) {
  if (n >= 100000) return Math.round(n / 1000) + 'k';
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

export function relativeTime(dateStr) {
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

export function animateCounter(el, target) {
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

export function parseRateLimit(response) {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  if (remaining !== null && parseInt(remaining) === 0 && reset) {
    const resetTime = parseInt(reset) * 1000;
    const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
    return `Rate limited — try again in ${minutes}m`;
  }
  return null;
}

export async function fetchJSON(url) {
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

export function renderError(container, message, retryFn) {
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p>${message}</p>
      <button class="retry-btn">Retry</button>
    </div>`;
  container.querySelector('.retry-btn').addEventListener('click', function() {
    this.disabled = true;
    this.textContent = 'Retrying…';
    retryFn();
  });
}

export async function cachedFetchJSON(url, ttl = 30 * 60 * 1000) {
  const cacheKey = 'nd_api_' + url;
  try {
    const cached = JSON.parse(sessionStorage.getItem(cacheKey));
    if (cached && Date.now() - cached.ts < ttl) {
      return { data: cached.data };
    }
  } catch { /* ignore */ }
  const result = await fetchJSON(url);
  try { sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result.data })); } catch { /* ignore */ }
  return result;
}

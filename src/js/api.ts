// --- API helpers ---
import type { FetchResult, CacheEntry } from './types.ts';

export function abbreviateNum(n: number): string {
  if (n >= 100000) return Math.round(n / 1000) + 'k';
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

export function relativeTime(dateStr: string): string {
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

export function animateCounter(el: HTMLElement, target: number): void {
  el.classList.remove('shimmer-placeholder');
  const duration = 1200;
  const start = performance.now();
  function tick(now: number): void {
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

export function parseRateLimit(response: Response): string | null {
  const remaining = response.headers.get('X-RateLimit-Remaining');
  const reset = response.headers.get('X-RateLimit-Reset');
  if (remaining !== null && Number.parseInt(remaining) === 0 && reset) {
    const resetTime = Number.parseInt(reset) * 1000;
    const minutes = Math.max(1, Math.ceil((resetTime - Date.now()) / 60000));
    return `Rate limited — try again in ${minutes}m`;
  }
  return null;
}

export async function fetchJSON<T = unknown>(url: string): Promise<FetchResult<T>> {
  const res = await fetch(url);
  if (res.status === 403 || res.status === 429) {
    const rateLimitMsg = parseRateLimit(res);
    if (rateLimitMsg) throw new Error(rateLimitMsg);
  }
  if (!res.ok) throw new Error(`API error (${res.status})`);
  const ct = res.headers.get('content-type') || '';
  if (!ct.includes('application/json')) throw new Error('Non-JSON response');
  return { data: (await res.json()) as T, response: res };
}

function escapeHTML(str: string): string {
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

export function renderError(container: Element, message: string, retryFn: () => void): void {
  container.innerHTML = `
    <div class="error-state">
      <div class="error-icon">⚠️</div>
      <p>${escapeHTML(message)}</p>
      <button class="retry-btn">Retry</button>
    </div>`;
  const btn = container.querySelector('.retry-btn') as HTMLButtonElement;
  btn.addEventListener('click', function (this: HTMLButtonElement) {
    this.disabled = true;
    this.textContent = 'Retrying…';
    retryFn();
  });
}

export async function cachedFetchJSON<T = unknown>(
  url: string,
  ttl: number = 30 * 60 * 1000,
): Promise<FetchResult<T>> {
  const cacheKey = 'nd_api_' + url;
  try {
    const raw = sessionStorage.getItem(cacheKey);
    if (raw) {
      const cached: CacheEntry<T> = JSON.parse(raw);
      if (cached && Date.now() - cached.ts < ttl) {
        return { data: cached.data };
      }
    }
  } catch {
    /* ignore */
  }
  const result = await fetchJSON<T>(url);
  try {
    sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), data: result.data }));
  } catch {
    /* ignore */
  }
  return result;
}

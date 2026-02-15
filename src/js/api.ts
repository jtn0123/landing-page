/**
 * API helpers — fetch utilities, caching, formatting, and error rendering.
 * @module api
 */
import type { FetchResult, CacheEntry } from './types.ts';

/**
 * Abbreviate a number for display (e.g., 12345 → "12.3k").
 * @param n - The number to abbreviate.
 * @returns A human-readable abbreviated string.
 */
export function abbreviateNum(n: number): string {
  if (n >= 100000) return Math.round(n / 1000) + 'k';
  if (n >= 10000) return (n / 1000).toFixed(1) + 'k';
  return n.toLocaleString();
}

/**
 * Format a date string as a relative time (e.g., "3h ago", "2d ago").
 * @param dateStr - ISO 8601 date string.
 * @returns A relative time string.
 */
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

/**
 * Animate a counter element from 0 to a target value with easing.
 * @param el - The DOM element whose textContent will be updated.
 * @param target - The target number to count up to.
 */
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

/**
 * Parse rate-limit headers from a GitHub API response.
 * @param response - The fetch Response object.
 * @returns A user-friendly rate-limit message, or null if not rate-limited.
 */
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

/**
 * Fetch JSON from a URL with error handling for rate limits and non-JSON responses.
 * @typeParam T - The expected shape of the JSON response.
 * @param url - The URL to fetch.
 * @returns The parsed JSON data and the raw Response.
 * @throws {Error} On HTTP errors, rate limits, or non-JSON responses.
 */
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

/**
 * Escape HTML special characters to prevent XSS in rendered strings.
 * @param str - The raw string to escape.
 * @returns The escaped string safe for innerHTML use.
 */
export function escapeHTML(str: string): string {
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

/**
 * Render an error state with a retry button inside a container element.
 * @param container - The DOM element to render the error into.
 * @param message - The error message to display.
 * @param retryFn - Callback invoked when the retry button is clicked.
 */
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

/**
 * Fetch JSON with sessionStorage caching. Returns cached data if within TTL.
 * @typeParam T - The expected shape of the JSON response.
 * @param url - The URL to fetch.
 * @param ttl - Cache time-to-live in milliseconds (default: 30 minutes).
 * @returns The parsed JSON data (from cache or network).
 */
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

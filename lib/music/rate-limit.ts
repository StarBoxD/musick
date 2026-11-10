const WINDOW_MS = 60_000;
const MAX_REQUESTS = 40;

/** Per-instance memory: serverless instances each keep their own window, so this caps bursts, not totals. */
const hits = new Map<string, number[]>();

/**
 * Sliding-window limiter keyed by user id. Returns seconds to wait when the limit is hit, otherwise 0.
 */
export function rateLimitRetryAfter(key: string, now = Date.now()): number {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < WINDOW_MS);
  if (recent.length >= MAX_REQUESTS) {
    hits.set(key, recent);
    return Math.max(1, Math.ceil((WINDOW_MS - (now - recent[0])) / 1000));
  }
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 500) {
    for (const [userKey, times] of hits) {
      if (!times.some((time) => now - time < WINDOW_MS)) hits.delete(userKey);
    }
  }
  return 0;
}

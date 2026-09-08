/**
 * The saved copy of a student's course list (#137).
 *
 * A rural connection drops mid-session more often than it refuses outright, so
 * the portal keeps the last good course list and renders it when the network
 * is gone. Kept as plain functions rather than hook internals so the cache
 * rules are unit-testable, the way batchDateUtils is.
 */

export const CACHE_KEY = "rca_portal_courses";

// Long enough to survive a commute with no signal, short enough that a stale
// list is never mistaken for the truth. The UI always labels a cached render.
export const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * The cache is per student. Without the id in the key, a shared phone would
 * show one sibling the other's courses for as long as the entry lived.
 */
export function cacheKey(userId) {
  return `${CACHE_KEY}:${userId ?? "anon"}`;
}

export function readCache(userId, storage = safeStorage(), now = Date.now()) {
  if (!storage) return null;
  try {
    const raw = storage.getItem(cacheKey(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // A hand-edited or half-written entry must not crash the screen it was
    // meant to rescue.
    if (!parsed || !Array.isArray(parsed.courses) || typeof parsed.savedAt !== "number") return null;
    if (now - parsed.savedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeCache(userId, courses, storage = safeStorage(), now = Date.now()) {
  if (!storage || !Array.isArray(courses)) return false;
  try {
    storage.setItem(cacheKey(userId), JSON.stringify({ courses, savedAt: now }));
    return true;
  } catch {
    // Private mode, or the quota is full. Losing the cache is not worth losing
    // the screen over.
    return false;
  }
}

export function clearCache(userId, storage = safeStorage()) {
  try {
    storage?.removeItem(cacheKey(userId));
  } catch {
    /* nothing useful to do */
  }
}

function safeStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/**
 * "2h 05m", "45m", "—". Lessons are minutes-to-hours long, so an h:mm:ss clock
 * would be three units of precision nobody reads.
 */
export function formatDuration(seconds) {
  const total = Number(seconds);
  if (!Number.isFinite(total) || total <= 0) return "—";
  const mins = Math.round(total / 60);
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${String(m).padStart(2, "0")}m`;
}

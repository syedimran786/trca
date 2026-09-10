/**
 * The rules behind a lesson's video (#188): nothing downloads until the
 * student taps, the size is shown before that, and a return visit resumes
 * where they stopped. Plain functions, like coursesCache, so they are
 * unit-testable without a browser.
 */

export const POSITION_KEY = "rca_lesson_position";

// The data-saver copy on #43 is a 360p export: roughly 500 kbit/s of video and
// audio together. Used only to estimate a size the API has not given.
export const DATA_SAVER_KBPS = 500;

// Stopping in the first seconds isn't worth resuming from, and stopping in the
// last seconds means the lesson is done: both clear the saved position.
export const MIN_RESUME_SECONDS = 10;
export const END_MARGIN_SECONDS = 15;

/** Per student and per lesson, so a shared phone keeps each sibling's place. */
export function positionKey(userId, lessonId) {
  return `${POSITION_KEY}:${userId ?? "anon"}:${lessonId}`;
}

/** Seconds to resume from, or 0. */
export function readPosition(userId, lessonId, storage = safeStorage()) {
  if (!storage) return 0;
  try {
    const seconds = Number(storage.getItem(positionKey(userId, lessonId)));
    return Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  } catch {
    return 0;
  }
}

/** Saves where the student is; forgets it near the start or the end. */
export function savePosition(userId, lessonId, seconds, duration, storage = safeStorage()) {
  if (!storage) return;
  const key = positionKey(userId, lessonId);
  const at = Number(seconds);
  const length = Number(duration);
  const nearEnd = Number.isFinite(length) && length > 0 && at >= length - END_MARGIN_SECONDS;
  try {
    if (!Number.isFinite(at) || at < MIN_RESUME_SECONDS || nearEnd) storage.removeItem(key);
    else storage.setItem(key, String(Math.floor(at)));
  } catch {
    // Private mode or a full store: resuming is a nicety, never a crash.
  }
}

/** Roughly what a lesson costs to watch, in bytes, when the real size isn't known. */
export function estimateBytes(durationSeconds, kbps = DATA_SAVER_KBPS) {
  const seconds = Number(durationSeconds);
  if (!Number.isFinite(seconds) || seconds <= 0) return 0;
  return Math.round((seconds * kbps * 1000) / 8);
}

/** "38 MB", "2.4 GB", "under 1 MB", or "" when there is nothing to say. */
export function formatBytes(bytes) {
  const n = Number(bytes);
  if (!Number.isFinite(n) || n <= 0) return "";
  const mb = n / 1_000_000;
  if (mb < 1) return "under 1 MB";
  if (mb < 1000) return `${Math.round(mb)} MB`;
  return `${(mb / 1000).toFixed(1)} GB`;
}

/** "1:05" or "1:02:05", for "Resume from". */
export function formatClock(seconds) {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = String(total % 60).padStart(2, "0");
  return h > 0 ? `${h}:${String(m).padStart(2, "0")}:${s}` : `${m}:${s}`;
}

/**
 * Whether the connection says data is precious: the browser's Save-Data
 * switch, or a 2G/3G estimate. Where the browser doesn't say (iPhones, older
 * WebViews) it reads as not known, and the size shown is the only warning.
 */
export function onMeteredConnection(nav = globalThis.navigator) {
  const connection = nav && nav.connection;
  if (!connection) return false;
  return Boolean(connection.saveData) || ["slow-2g", "2g", "3g"].includes(connection.effectiveType);
}

/**
 * The URL the <video> element loads. Lesson video comes from the portal API
 * (#187), so like every portal request it is made absolute inside the app
 * (see lib/apiBase). A full http(s) URL, such as a sample file while #187 is
 * built, is used as it is.
 */
export function videoSource(url, origin = "") {
  if (!url) return "";
  if (/^https?:\/\//i.test(url)) return url;
  return `${origin}${url.startsWith("/") ? "" : "/"}${url}`;
}

function safeStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

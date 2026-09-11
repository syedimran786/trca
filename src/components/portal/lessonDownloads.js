/**
 * Saving a lesson's video to the phone, in the Android app (#189).
 *
 * A rural connection drops mid-lesson more often than it refuses outright, so a
 * student can save a lesson once on a good connection and watch it later with
 * none. Like lessonPlayback and coursesCache, the rules are plain functions:
 * the download loop takes `fetch` and the file store as arguments, so a dropped
 * connection and a resume are unit-tested without a phone.
 *
 * What lives where:
 *   - the video, in the app's private storage (offlineFiles.js), one file per
 *     student and lesson;
 *   - a small record per download in localStorage: its course, its full size,
 *     and whether it finished;
 *   - a copy of the course (titles and notes) for as long as any of its lessons
 *     is saved, so the course page opens with no connection.
 * The file's size on disk is the truth for how much is saved: a record can lag
 * a killed app by one piece, the file cannot.
 */

export const DOWNLOADS_KEY = "rca_lesson_downloads";
export const COURSE_COPY_KEY = "rca_course_copy";
export const DOWNLOAD_DIR = "lessons";

// Bytes held in memory before they are written to the file. A dropped
// connection loses at most this much, and a low-end phone never holds a whole
// lesson in memory.
export const PIECE_BYTES = 1024 * 1024;

const who = (userId) => userId ?? "anon";

/** Per student, so a shared phone keeps each sibling's saved lessons apart. */
export function downloadsKey(userId) {
  return `${DOWNLOADS_KEY}:${who(userId)}`;
}

export function courseCopyKey(userId, slug) {
  return `${COURSE_COPY_KEY}:${who(userId)}:${slug}`;
}

/** Where a lesson's video is kept. Ids are reduced to safe characters, so no id can reach outside the folder. */
export function lessonFilePath(userId, lessonId) {
  const safe = (v) => String(v ?? "anon").replace(/[^A-Za-z0-9_-]/g, "_");
  return `${DOWNLOAD_DIR}/${safe(userId)}/${safe(lessonId)}.mp4`;
}

/** Every saved or half-saved lesson for this student, keyed by lesson id. */
export function readDownloads(userId, storage = safeStorage()) {
  if (!storage) return {};
  try {
    const parsed = JSON.parse(storage.getItem(downloadsKey(userId)) || "{}");
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    const out = {};
    for (const [id, entry] of Object.entries(parsed)) {
      // A hand-edited or half-written record must not break the course page
      if (entry && typeof entry.path === "string" && typeof entry.slug === "string") out[id] = entry;
    }
    return out;
  } catch {
    return {};
  }
}

/** Adds or replaces one lesson's record. */
export function writeDownload(userId, entry, storage = safeStorage(), now = Date.now()) {
  if (!storage || !entry || entry.lessonId == null) return false;
  try {
    const all = readDownloads(userId, storage);
    all[String(entry.lessonId)] = { ...entry, savedAt: now };
    storage.setItem(downloadsKey(userId), JSON.stringify(all));
    return true;
  } catch {
    // Private mode or a full store: the file is still on disk, and the next
    // attempt picks up from its size.
    return false;
  }
}

/** Forgets one lesson; returns what is left. */
export function removeDownload(userId, lessonId, storage = safeStorage()) {
  const all = readDownloads(userId, storage);
  delete all[String(lessonId)];
  try {
    storage?.setItem(downloadsKey(userId), JSON.stringify(all));
  } catch {
    /* nothing useful to do */
  }
  return all;
}

export function downloadFor(downloads, lessonId) {
  return (downloads && downloads[String(lessonId)]) || null;
}

/** Space a course's lessons take on this phone. Half-saved ones count: they take space too. */
export function courseUsage(downloads, slug) {
  let bytes = 0;
  let lessons = 0;
  for (const entry of Object.values(downloads || {})) {
    if (entry.slug !== slug) continue;
    lessons += 1;
    const n = Number(entry.bytes);
    if (Number.isFinite(n) && n > 0) bytes += n;
  }
  return { bytes, lessons };
}

/** 0-100, or null while the full size is not known. */
export function progressPercent(bytes, total) {
  const have = Number(bytes);
  const all = Number(total);
  if (!Number.isFinite(all) || all <= 0) return null;
  if (!Number.isFinite(have) || have <= 0) return 0;
  return Math.min(100, Math.floor((have / all) * 100));
}

/** Keeps the course (titles and notes) so its page opens offline. */
export function saveCourseCopy(userId, course, storage = safeStorage(), now = Date.now()) {
  if (!storage || !course || !course.slug) return false;
  try {
    storage.setItem(courseCopyKey(userId, course.slug), JSON.stringify({ course, savedAt: now }));
    return true;
  } catch {
    return false;
  }
}

/**
 * No age limit, unlike the course list's cache: the copy lives exactly as long
 * as a saved lesson needs it, and deleting the last one removes it.
 */
export function readCourseCopy(userId, slug, storage = safeStorage()) {
  if (!storage || !slug) return null;
  try {
    const parsed = JSON.parse(storage.getItem(courseCopyKey(userId, slug)) || "null");
    if (!parsed || !parsed.course || !Array.isArray(parsed.course.lessons) || typeof parsed.savedAt !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function removeCourseCopy(userId, slug, storage = safeStorage()) {
  try {
    storage?.removeItem(courseCopyKey(userId, slug));
  } catch {
    /* nothing useful to do */
  }
}

/**
 * `bytes 0-1023/5000` → { start: 0, end: 1023, total: 5000 }.
 * `bytes *\/5000` (a 416's answer) → start and end null. total is null for `/*`.
 */
export function parseContentRange(value) {
  const m = /^bytes\s+(?:(\d+)-(\d+)|\*)\/(\d+|\*)$/i.exec(String(value || "").trim());
  if (!m) return null;
  return {
    start: m[1] === undefined ? null : Number(m[1]),
    end: m[2] === undefined ? null : Number(m[2]),
    total: m[3] === "*" ? null : Number(m[3]),
  };
}

/**
 * Base64, which is how the file plugin takes binary. Built in slices: one
 * String.fromCharCode over a megabyte overflows the call stack.
 */
export function toBase64(bytes) {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

export class DownloadError extends Error {
  constructor(reason, status) {
    super(`lesson download: ${reason}${status ? ` (${status})` : ""}`);
    this.name = "DownloadError";
    this.reason = reason; // "http" | "range" | "short"
    this.status = status;
  }
}

/**
 * Saves `url` to `path`, carrying on from whatever is already there.
 *
 * Asks for `Range: bytes=<saved>-`. A 206 that starts where the file ends is
 * appended; a 200 means the server ignored the range, so the file starts over
 * rather than get its first bytes glued on twice. Pieces are written as they
 * arrive, so a connection that drops mid-lesson keeps everything up to the last
 * piece, and the next call picks up from there.
 *
 * `files` is { size(path), reset(path), append(path, base64) }: offlineFiles.js
 * in the app, an in-memory stand-in in the tests.
 *
 * Returns { bytes, total, done: true }. Otherwise throws: a DownloadError, the
 * network's own TypeError, or an AbortError. The partial file stays in place.
 */
export async function downloadLesson({
  url,
  path,
  files,
  fetchImpl = globalThis.fetch,
  credentials,
  signal,
  onProgress,
  pieceBytes = PIECE_BYTES,
}) {
  let start = await files.size(path);
  const headers = start > 0 ? { Range: `bytes=${start}-` } : {};
  const res = await fetchImpl(url, { headers, credentials, signal });

  if (res.status === 416 && start > 0) {
    // Asked for bytes past the end. Either the file is already whole, or it is
    // longer than the lesson now is (the video was replaced): start over.
    const range = parseContentRange(res.headers.get("content-range"));
    if (range && range.total === start) return { bytes: start, total: start, done: true };
    await files.reset(path);
    return downloadLesson({ url, path, files, fetchImpl, credentials, signal, onProgress, pieceBytes });
  }
  if (!res.ok) throw new DownloadError("http", res.status);

  let total;
  if (res.status === 206) {
    const range = parseContentRange(res.headers.get("content-range"));
    // Bytes from anywhere but where the file ends would corrupt it
    if (!range || range.start !== start) throw new DownloadError("range", res.status);
    total = range.total;
  } else {
    start = 0;
    const length = Number(res.headers.get("content-length"));
    total = Number.isFinite(length) && length > 0 ? length : null;
  }
  if (start === 0) await files.reset(path);

  let saved = start;
  let pending = [];
  let pendingBytes = 0;
  if (onProgress) onProgress({ bytes: saved, total });

  const flush = async () => {
    if (!pendingBytes) return;
    const joined = new Uint8Array(pendingBytes);
    let at = 0;
    for (const piece of pending) {
      joined.set(piece, at);
      at += piece.length;
    }
    pending = [];
    pendingBytes = 0;
    await files.append(path, toBase64(joined));
    saved += joined.length;
    if (onProgress) onProgress({ bytes: saved, total });
  };

  const take = async (piece) => {
    pending.push(piece);
    pendingBytes += piece.length;
    if (pendingBytes >= pieceBytes) await flush();
  };

  try {
    if (res.body && typeof res.body.getReader === "function") {
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value && value.length) await take(value);
      }
    } else {
      // An older WebView without streamed bodies: the whole response at once
      await take(new Uint8Array(await res.arrayBuffer()));
    }
  } finally {
    // What arrived before a drop is kept, so the next attempt resumes after it
    await flush();
  }

  // The connection closed early without an error: keep what came, report it
  if (total != null && saved < total) throw new DownloadError("short");
  return { bytes: saved, total: total ?? saved, done: true };
}

function safeStorage() {
  try {
    return globalThis.localStorage || null;
  } catch {
    return null;
  }
}

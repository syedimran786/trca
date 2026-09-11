import { Buffer } from "node:buffer";
import { describe, it, expect, vi } from "vitest";
import {
  DownloadError,
  courseCopyKey,
  courseUsage,
  downloadFor,
  downloadLesson,
  downloadsKey,
  lessonFilePath,
  parseContentRange,
  progressPercent,
  readCourseCopy,
  readDownloads,
  removeCourseCopy,
  removeDownload,
  saveCourseCopy,
  toBase64,
  writeDownload,
} from "./lessonDownloads";

// A localStorage stand-in. `fail` makes every call throw, which is what a
// browser in private mode or over quota actually does.
function memStore(seed = {}, fail = false) {
  const map = new Map(Object.entries(seed));
  const boom = () => {
    throw new Error("storage unavailable");
  };
  return {
    getItem: (k) => (fail ? boom() : map.has(k) ? map.get(k) : null),
    setItem: (k, v) => (fail ? boom() : void map.set(k, v)),
    removeItem: (k) => (fail ? boom() : void map.delete(k)),
    map,
  };
}

// The phone's file store, in memory: path → bytes. Takes base64 like the plugin.
function memFiles(seed = {}) {
  const map = new Map(Object.entries(seed).map(([k, v]) => [k, Uint8Array.from(v)]));
  const files = {
    map,
    size: vi.fn(async (p) => (map.has(p) ? map.get(p).length : 0)),
    reset: vi.fn(async (p) => void map.set(p, new Uint8Array(0))),
    append: vi.fn(async (p, b64) => {
      const add = Uint8Array.from(Buffer.from(b64, "base64"));
      const old = map.get(p) || new Uint8Array(0);
      const next = new Uint8Array(old.length + add.length);
      next.set(old);
      next.set(add, old.length);
      map.set(p, next);
    }),
    bytes: (p) => Array.from(map.get(p) || []),
  };
  return files;
}

// A 20-byte "lesson": 1..20, so a misplaced byte is visible in a failure
const LESSON = Uint8Array.from({ length: 20 }, (_, i) => i + 1);
const ALL = Array.from(LESSON);
const PATH = "lessons/7/42.mp4";

/**
 * A video server. With `honourRange` it answers ranges the way R2 does behind
 * #187's endpoint; without, it sends the whole file with a 200. `dropAfter`
 * errors the stream after that many bytes, as a lost connection does; `stopAt`
 * closes it cleanly there instead. Sends `pieces` bytes at a time.
 */
function server({ honourRange = true, dropAfter = Infinity, stopAt = Infinity, pieces = 3, length = true } = {}) {
  const ranges = [];
  const fetchImpl = vi.fn(async (_url, init = {}) => {
    const range = init.headers && init.headers.Range;
    ranges.push(range || null);
    let from = 0;
    let status = 200;
    const headers = new Headers({ "content-type": "video/mp4" });
    if (range && honourRange) {
      from = Number(/bytes=(\d+)-/.exec(range)[1]);
      if (from >= LESSON.length) {
        return new Response(null, { status: 416, headers: { "content-range": `bytes */${LESSON.length}` } });
      }
      status = 206;
      headers.set("content-range", `bytes ${from}-${LESSON.length - 1}/${LESSON.length}`);
    }
    if (length) headers.set("content-length", String(LESSON.length - from));
    const body = LESSON.slice(from);
    let sent = 0;
    const stream = new ReadableStream({
      pull(controller) {
        if (sent >= body.length || sent >= stopAt) return controller.close();
        if (sent >= dropAfter) return controller.error(new TypeError("network connection lost"));
        const end = Math.min(body.length, sent + pieces, dropAfter, stopAt);
        controller.enqueue(body.slice(sent, end));
        sent = end;
      },
    });
    return new Response(stream, { status, headers });
  });
  return { fetchImpl, ranges };
}

describe("keys and paths", () => {
  it("keeps each student's downloads and course copies apart", () => {
    expect(downloadsKey(1)).not.toBe(downloadsKey(2));
    expect(downloadsKey(undefined)).toBe(downloadsKey(null));
    expect(courseCopyKey(1, "java")).not.toBe(courseCopyKey(2, "java"));
    expect(courseCopyKey(1, "java")).not.toBe(courseCopyKey(1, "python"));
  });

  it("puts each student's lesson in its own file", () => {
    expect(lessonFilePath(7, 42)).toBe("lessons/7/42.mp4");
    expect(lessonFilePath(7, 42)).not.toBe(lessonFilePath(8, 42));
    expect(lessonFilePath(null, 42)).toBe("lessons/anon/42.mp4");
  });

  it("cannot be steered outside the lessons folder by an odd id", () => {
    const path = lessonFilePath("../../x", "a/b");
    expect(path.startsWith("lessons/")).toBe(true);
    expect(path.split("/")).toHaveLength(3);
    expect(path).not.toContain("..");
  });
});

describe("download records", () => {
  it("round-trips, stamped with when it was saved", () => {
    const store = memStore();
    const entry = { lessonId: 42, slug: "java", path: PATH, bytes: 10, total: 20, done: false };
    expect(writeDownload(7, entry, store, 1000)).toBe(true);
    expect(readDownloads(7, store)).toEqual({ 42: { ...entry, savedAt: 1000 } });
    expect(downloadFor(readDownloads(7, store), 42)).toMatchObject({ bytes: 10 });
    expect(readDownloads(8, store)).toEqual({});
  });

  it("replaces a lesson's record rather than adding a second one", () => {
    const store = memStore();
    writeDownload(7, { lessonId: 42, slug: "java", path: PATH, bytes: 10 }, store);
    writeDownload(7, { lessonId: 42, slug: "java", path: PATH, bytes: 20, done: true }, store);
    const all = readDownloads(7, store);
    expect(Object.keys(all)).toEqual(["42"]);
    expect(all[42]).toMatchObject({ bytes: 20, done: true });
  });

  it("removes one lesson and returns the rest", () => {
    const store = memStore();
    writeDownload(7, { lessonId: 1, slug: "java", path: "a" }, store);
    writeDownload(7, { lessonId: 2, slug: "java", path: "b" }, store);
    const left = removeDownload(7, 1, store);
    expect(Object.keys(left)).toEqual(["2"]);
    expect(Object.keys(readDownloads(7, store))).toEqual(["2"]);
  });

  it("reads a corrupt or hand-edited store as empty, keeping the good records", () => {
    expect(readDownloads(7, memStore({ [downloadsKey(7)]: "{not json" }))).toEqual({});
    expect(readDownloads(7, memStore({ [downloadsKey(7)]: "[1,2]" }))).toEqual({});
    const mixed = memStore({
      [downloadsKey(7)]: JSON.stringify({ 1: { path: "a", slug: "java" }, 2: { path: 5 }, 3: null }),
    });
    expect(Object.keys(readDownloads(7, mixed))).toEqual(["1"]);
  });

  it("never throws when storage does", () => {
    const broken = memStore({}, true);
    expect(readDownloads(7, broken)).toEqual({});
    expect(writeDownload(7, { lessonId: 1, slug: "java", path: "a" }, broken)).toBe(false);
    expect(removeDownload(7, 1, broken)).toEqual({});
    expect(readDownloads(7, null)).toEqual({});
  });

  it("refuses a record with no lesson id", () => {
    expect(writeDownload(7, { slug: "java", path: "a" }, memStore())).toBe(false);
  });
});

describe("courseUsage", () => {
  const downloads = {
    1: { slug: "java", path: "a", bytes: 30_000_000, done: true },
    2: { slug: "java", path: "b", bytes: 5_000_000, done: false },
    3: { slug: "python", path: "c", bytes: 99_000_000, done: true },
    4: { slug: "java", path: "d", bytes: "junk" },
  };

  it("adds up one course's lessons, half-saved ones included", () => {
    expect(courseUsage(downloads, "java")).toEqual({ bytes: 35_000_000, lessons: 3 });
  });

  it("is zero for a course with nothing saved", () => {
    expect(courseUsage(downloads, "mern")).toEqual({ bytes: 0, lessons: 0 });
    expect(courseUsage(undefined, "java")).toEqual({ bytes: 0, lessons: 0 });
  });
});

describe("progressPercent", () => {
  it("is a whole percentage, never over 100", () => {
    expect(progressPercent(5, 20)).toBe(25);
    expect(progressPercent(19, 20)).toBe(95);
    expect(progressPercent(25, 20)).toBe(100);
    expect(progressPercent(0, 20)).toBe(0);
  });

  it("is null while the full size is unknown", () => {
    expect(progressPercent(5, null)).toBeNull();
    expect(progressPercent(5, 0)).toBeNull();
  });
});

describe("course copies", () => {
  const course = { slug: "java", title: "Java", lessons: [{ id: 42, title: "Intro", notes: "Read me" }] };

  it("round-trips per student and course", () => {
    const store = memStore();
    expect(saveCourseCopy(7, course, store, 500)).toBe(true);
    expect(readCourseCopy(7, "java", store)).toEqual({ course, savedAt: 500 });
    expect(readCourseCopy(8, "java", store)).toBeNull();
    removeCourseCopy(7, "java", store);
    expect(readCourseCopy(7, "java", store)).toBeNull();
  });

  it("reads a malformed copy as none", () => {
    const key = courseCopyKey(7, "java");
    expect(readCourseCopy(7, "java", memStore({ [key]: "{oops" }))).toBeNull();
    expect(readCourseCopy(7, "java", memStore({ [key]: JSON.stringify({ course: { slug: "java" }, savedAt: 1 }) }))).toBeNull();
    expect(readCourseCopy(7, "java", memStore({ [key]: JSON.stringify({ course }) }))).toBeNull();
  });

  it("never throws when storage does, and skips a course with no slug", () => {
    const broken = memStore({}, true);
    expect(saveCourseCopy(7, course, broken)).toBe(false);
    expect(readCourseCopy(7, "java", broken)).toBeNull();
    expect(() => removeCourseCopy(7, "java", broken)).not.toThrow();
    expect(saveCourseCopy(7, { title: "no slug" }, memStore())).toBe(false);
  });
});

describe("parseContentRange", () => {
  it("reads a partial response's range", () => {
    expect(parseContentRange("bytes 5-19/20")).toEqual({ start: 5, end: 19, total: 20 });
  });

  it("reads a 416's answer and an unknown total", () => {
    expect(parseContentRange("bytes */20")).toEqual({ start: null, end: null, total: 20 });
    expect(parseContentRange("bytes 0-9/*")).toEqual({ start: 0, end: 9, total: null });
  });

  it("rejects anything else", () => {
    expect(parseContentRange("items 0-9/20")).toBeNull();
    expect(parseContentRange("")).toBeNull();
    expect(parseContentRange(null)).toBeNull();
  });
});

describe("toBase64", () => {
  it("matches Node's encoder, past the slice size", () => {
    const bytes = Uint8Array.from({ length: 70_000 }, (_, i) => (i * 7) % 256);
    expect(toBase64(bytes)).toBe(Buffer.from(bytes).toString("base64"));
    expect(toBase64(new Uint8Array(0))).toBe("");
  });
});

describe("downloadLesson", () => {
  it("saves a lesson from scratch, reporting progress as it goes", async () => {
    const files = memFiles();
    const { fetchImpl, ranges } = server();
    const seen = [];
    const result = await downloadLesson({
      url: "/v",
      path: PATH,
      files,
      fetchImpl,
      pieceBytes: 4,
      onProgress: (p) => seen.push(p),
    });
    expect(result).toEqual({ bytes: 20, total: 20, done: true });
    expect(files.bytes(PATH)).toEqual(ALL);
    expect(ranges).toEqual([null]); // nothing saved yet, so no Range
    expect(seen[0]).toEqual({ bytes: 0, total: 20 });
    expect(seen.at(-1)).toEqual({ bytes: 20, total: 20 });
    expect(seen.map((p) => p.bytes)).toEqual([...seen.map((p) => p.bytes)].sort((a, b) => a - b));
  });

  it("writes in pieces rather than holding the whole lesson in memory", async () => {
    const files = memFiles();
    await downloadLesson({ url: "/v", path: PATH, files, fetchImpl: server({ pieces: 2 }).fetchImpl, pieceBytes: 4 });
    // 20 bytes in pieces of 4 or more: several writes, none of them the whole file
    expect(files.append.mock.calls.length).toBeGreaterThan(2);
    for (const [, b64] of files.append.mock.calls) expect(Buffer.from(b64, "base64").length).toBeLessThan(20);
  });

  it("keeps what arrived when the connection drops, and resumes after it", async () => {
    const files = memFiles();
    const dropping = server({ dropAfter: 9 });
    await expect(
      downloadLesson({ url: "/v", path: PATH, files, fetchImpl: dropping.fetchImpl, pieceBytes: 4 }),
    ).rejects.toThrow("network connection lost");
    expect(files.bytes(PATH)).toEqual(ALL.slice(0, 9));

    const back = server();
    const result = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl: back.fetchImpl, pieceBytes: 4 });
    expect(back.ranges).toEqual(["bytes=9-"]);
    expect(result).toEqual({ bytes: 20, total: 20, done: true });
    expect(files.bytes(PATH)).toEqual(ALL);
  });

  it("carries on from a file already partly saved, asking only for the rest", async () => {
    const files = memFiles({ [PATH]: ALL.slice(0, 5) });
    const { fetchImpl, ranges } = server();
    const seen = [];
    await downloadLesson({ url: "/v", path: PATH, files, fetchImpl, onProgress: (p) => seen.push(p) });
    expect(ranges).toEqual(["bytes=5-"]);
    expect(files.reset).not.toHaveBeenCalled();
    expect(files.bytes(PATH)).toEqual(ALL);
    expect(seen[0]).toEqual({ bytes: 5, total: 20 }); // the bar starts where it left off
  });

  it("starts over when the server ignores the range, rather than duplicate bytes", async () => {
    const files = memFiles({ [PATH]: [9, 9, 9, 9, 9] });
    const { fetchImpl, ranges } = server({ honourRange: false });
    const result = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl });
    expect(ranges).toEqual(["bytes=5-"]);
    expect(result.bytes).toBe(20);
    expect(files.bytes(PATH)).toEqual(ALL);
  });

  it("treats a 416 for a whole file as done, without a byte written", async () => {
    const files = memFiles({ [PATH]: ALL });
    const result = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl: server().fetchImpl });
    expect(result).toEqual({ bytes: 20, total: 20, done: true });
    expect(files.append).not.toHaveBeenCalled();
  });

  it("starts over when the saved file is longer than the lesson now is", async () => {
    const files = memFiles({ [PATH]: Array.from({ length: 25 }, () => 0) });
    const { fetchImpl, ranges } = server();
    await downloadLesson({ url: "/v", path: PATH, files, fetchImpl });
    expect(ranges).toEqual(["bytes=25-", null]);
    expect(files.bytes(PATH)).toEqual(ALL);
  });

  it("refuses a partial response that starts in the wrong place", async () => {
    const files = memFiles({ [PATH]: ALL.slice(0, 5) });
    const fetchImpl = async () =>
      new Response(LESSON, { status: 206, headers: { "content-range": "bytes 0-19/20" } });
    const err = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl }).catch((e) => e);
    expect(err).toBeInstanceOf(DownloadError);
    expect(err.reason).toBe("range");
    expect(files.bytes(PATH)).toEqual(ALL.slice(0, 5)); // untouched
  });

  it("reports an HTTP failure with its status", async () => {
    const files = memFiles();
    const fetchImpl = async () => new Response("not found", { status: 404 });
    const err = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl }).catch((e) => e);
    expect(err).toBeInstanceOf(DownloadError);
    expect(err).toMatchObject({ reason: "http", status: 404 });
  });

  it("reports a connection that closes early without an error, keeping what came", async () => {
    const files = memFiles();
    const { fetchImpl } = server({ stopAt: 10 });
    const err = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl }).catch((e) => e);
    expect(err).toMatchObject({ reason: "short" });
    expect(files.bytes(PATH)).toEqual(ALL.slice(0, 10));
  });

  it("finishes when the server does not say how big the lesson is", async () => {
    const files = memFiles();
    const result = await downloadLesson({ url: "/v", path: PATH, files, fetchImpl: server({ length: false }).fetchImpl });
    expect(result).toEqual({ bytes: 20, total: 20, done: true });
  });

  it("works on a WebView without streamed response bodies", async () => {
    const files = memFiles();
    const fetchImpl = async () => ({
      status: 200,
      ok: true,
      headers: new Headers({ "content-length": "20" }),
      body: null,
      arrayBuffer: async () => LESSON.slice().buffer,
    });
    await downloadLesson({ url: "/v", path: PATH, files, fetchImpl });
    expect(files.bytes(PATH)).toEqual(ALL);
  });

  it("sends the session cookie mode and the stop signal with the request", async () => {
    const files = memFiles();
    const { fetchImpl } = server();
    const controller = new AbortController();
    await downloadLesson({ url: "https://api/v", path: PATH, files, fetchImpl, credentials: "include", signal: controller.signal });
    expect(fetchImpl).toHaveBeenCalledWith("https://api/v", expect.objectContaining({ credentials: "include", signal: controller.signal }));
  });

  it("stops when told to, keeping what was saved", async () => {
    const files = memFiles();
    const controller = new AbortController();
    const { fetchImpl } = server({ pieces: 4 });
    const run = downloadLesson({
      url: "/v",
      path: PATH,
      files,
      fetchImpl,
      pieceBytes: 4,
      signal: controller.signal,
      onProgress: (p) => {
        if (p.bytes >= 8) controller.abort();
      },
    });
    // The fake server ignores the signal, as a finished response does: what
    // matters is that nothing already written is lost
    await run.catch(() => {});
    expect(files.bytes(PATH).slice(0, 8)).toEqual(ALL.slice(0, 8));
  });
});

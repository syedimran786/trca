import { describe, it, expect } from "vitest";
import {
  cacheKey,
  readCache,
  writeCache,
  clearCache,
  formatDuration,
  MAX_AGE_MS,
} from "./coursesCache";

// A localStorage stand-in. `fail` makes every call throw, which is what a
// browser in private mode or over quota actually does.
function memStore(seed = {}, fail = false) {
  const map = new Map(Object.entries(seed));
  const boom = () => {
    throw new Error("storage unavailable");
  };
  return {
    getItem: (k) => (fail ? boom() : (map.has(k) ? map.get(k) : null)),
    setItem: (k, v) => (fail ? boom() : void map.set(k, v)),
    removeItem: (k) => (fail ? boom() : void map.delete(k)),
    map,
  };
}
const entry = (courses, savedAt) => JSON.stringify({ courses, savedAt });

describe("cacheKey", () => {
  it("is scoped per student, so a shared phone never leaks a sibling's courses", () => {
    expect(cacheKey(1)).not.toBe(cacheKey(2));
  });

  it("has a stable fallback when there is no user id", () => {
    expect(cacheKey(undefined)).toBe(cacheKey(null));
  });
});

describe("readCache", () => {
  const now = 1_000_000_000;

  it("returns a fresh entry", () => {
    const store = memStore({ [cacheKey(1)]: entry([{ id: 9 }], now - 1000) });
    expect(readCache(1, store, now).courses).toEqual([{ id: 9 }]);
  });

  it("returns null when nothing is saved", () => {
    expect(readCache(1, memStore(), now)).toBeNull();
  });

  it("drops an entry past its max age rather than showing a stale list", () => {
    const store = memStore({ [cacheKey(1)]: entry([{ id: 9 }], now - MAX_AGE_MS - 1) });
    expect(readCache(1, store, now)).toBeNull();
  });

  it("keeps an entry exactly at the boundary", () => {
    const store = memStore({ [cacheKey(1)]: entry([{ id: 9 }], now - MAX_AGE_MS) });
    expect(readCache(1, store, now)).not.toBeNull();
  });

  it("survives corrupt JSON instead of crashing the screen it exists to rescue", () => {
    expect(readCache(1, memStore({ [cacheKey(1)]: "{not json" }), now)).toBeNull();
  });

  it("rejects a well-formed entry with the wrong shape", () => {
    const store = memStore({ [cacheKey(1)]: JSON.stringify({ courses: "nope", savedAt: now }) });
    expect(readCache(1, store, now)).toBeNull();
  });

  it("rejects an entry with no timestamp, which could never be aged out", () => {
    const store = memStore({ [cacheKey(1)]: JSON.stringify({ courses: [] }) });
    expect(readCache(1, store, now)).toBeNull();
  });

  it("returns null when storage itself throws", () => {
    expect(readCache(1, memStore({}, true), now)).toBeNull();
  });

  it("does not read another student's entry", () => {
    const store = memStore({ [cacheKey(2)]: entry([{ id: 9 }], now) });
    expect(readCache(1, store, now)).toBeNull();
  });
});

describe("writeCache", () => {
  it("round-trips through readCache", () => {
    const store = memStore();
    expect(writeCache(1, [{ id: 4 }], store, 500)).toBe(true);
    expect(readCache(1, store, 600).courses).toEqual([{ id: 4 }]);
  });

  it("refuses a non-array rather than saving something unreadable", () => {
    expect(writeCache(1, null, memStore())).toBe(false);
  });

  it("reports failure instead of throwing when storage is unavailable", () => {
    expect(writeCache(1, [], memStore({}, true))).toBe(false);
  });

  it("swallows a failing removeItem", () => {
    expect(() => clearCache(1, memStore({}, true))).not.toThrow();
  });
});

describe("formatDuration", () => {
  it("renders minutes under an hour", () => {
    expect(formatDuration(45 * 60)).toBe("45m");
  });

  it("renders whole hours without a stray 00m", () => {
    expect(formatDuration(2 * 3600)).toBe("2h");
  });

  it("pads the minutes so a lesson list stays aligned", () => {
    expect(formatDuration(2 * 3600 + 5 * 60)).toBe("2h 05m");
  });

  it("gives a dash for missing, zero or nonsense values", () => {
    expect(formatDuration(null)).toBe("—");
    expect(formatDuration(0)).toBe("—");
    expect(formatDuration(-30)).toBe("—");
    expect(formatDuration("abc")).toBe("—");
  });
});

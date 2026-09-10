import { describe, it, expect } from "vitest";
import {
  positionKey,
  readPosition,
  savePosition,
  estimateBytes,
  formatBytes,
  formatClock,
  onMeteredConnection,
  videoSource,
  MIN_RESUME_SECONDS,
  END_MARGIN_SECONDS,
} from "./lessonPlayback";

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

describe("positionKey", () => {
  it("is scoped per student and per lesson", () => {
    expect(positionKey(1, 7)).not.toBe(positionKey(2, 7));
    expect(positionKey(1, 7)).not.toBe(positionKey(1, 8));
  });

  it("has a stable fallback when there is no user id", () => {
    expect(positionKey(undefined, 7)).toBe(positionKey(null, 7));
  });
});

describe("savePosition / readPosition", () => {
  it("resumes where the student stopped, in whole seconds", () => {
    const store = memStore();
    savePosition(1, 7, 125.8, 2700, store);
    expect(readPosition(1, 7, store)).toBe(125);
  });

  it("keeps each student's place on a shared phone", () => {
    const store = memStore();
    savePosition(1, 7, 300, 2700, store);
    savePosition(2, 7, 900, 2700, store);
    expect(readPosition(1, 7, store)).toBe(300);
    expect(readPosition(2, 7, store)).toBe(900);
  });

  it("forgets a stop in the first seconds", () => {
    const store = memStore();
    savePosition(1, 7, 300, 2700, store);
    savePosition(1, 7, MIN_RESUME_SECONDS - 1, 2700, store);
    expect(readPosition(1, 7, store)).toBe(0);
  });

  it("forgets a finished lesson, so it starts from the top next time", () => {
    const store = memStore();
    savePosition(1, 7, 300, 2700, store);
    savePosition(1, 7, 2700 - END_MARGIN_SECONDS, 2700, store);
    expect(readPosition(1, 7, store)).toBe(0);
  });

  it("still saves when the duration isn't known yet", () => {
    const store = memStore();
    savePosition(1, 7, 300, NaN, store);
    expect(readPosition(1, 7, store)).toBe(300);
  });

  it("reads a hand-edited value as no position", () => {
    const store = memStore({ [positionKey(1, 7)]: "not a number" });
    expect(readPosition(1, 7, store)).toBe(0);
  });

  it("never throws when storage does", () => {
    const store = memStore({}, true);
    expect(() => savePosition(1, 7, 300, 2700, store)).not.toThrow();
    expect(readPosition(1, 7, store)).toBe(0);
  });
});

describe("estimateBytes / formatBytes", () => {
  it("estimates a 360p lesson at about 500 kbit/s", () => {
    expect(estimateBytes(600)).toBe(37_500_000); // 10 minutes
    expect(formatBytes(estimateBytes(600))).toBe("38 MB");
  });

  it("says nothing for a lesson with no duration", () => {
    expect(estimateBytes(0)).toBe(0);
    expect(estimateBytes(null)).toBe(0);
    expect(formatBytes(0)).toBe("");
  });

  it("formats small and large sizes", () => {
    expect(formatBytes(500_000)).toBe("under 1 MB");
    expect(formatBytes(2_400_000_000)).toBe("2.4 GB");
  });
});

describe("formatClock", () => {
  it("formats minutes and hours", () => {
    expect(formatClock(0)).toBe("0:00");
    expect(formatClock(65)).toBe("1:05");
    expect(formatClock(3725)).toBe("1:02:05");
  });
});

describe("onMeteredConnection", () => {
  it("is true for Save-Data or a 2G/3G estimate", () => {
    expect(onMeteredConnection({ connection: { saveData: true, effectiveType: "4g" } })).toBe(true);
    expect(onMeteredConnection({ connection: { effectiveType: "3g" } })).toBe(true);
    expect(onMeteredConnection({ connection: { effectiveType: "slow-2g" } })).toBe(true);
  });

  it("is false for a fast connection, or where the browser doesn't say", () => {
    expect(onMeteredConnection({ connection: { effectiveType: "4g" } })).toBe(false);
    expect(onMeteredConnection({})).toBe(false);
    expect(onMeteredConnection(undefined)).toBe(false);
  });
});

describe("videoSource", () => {
  it("makes an API path absolute inside the app", () => {
    expect(videoSource("/api/portal/lessons/3/video", "https://restcoderacademy.in")).toBe(
      "https://restcoderacademy.in/api/portal/lessons/3/video"
    );
  });

  it("leaves an API path relative on the web", () => {
    expect(videoSource("/api/portal/lessons/3/video", "")).toBe("/api/portal/lessons/3/video");
  });

  it("uses a full URL as it is", () => {
    expect(videoSource("https://example.com/sample.mp4", "https://restcoderacademy.in")).toBe(
      "https://example.com/sample.mp4"
    );
  });

  it("is empty with no URL", () => {
    expect(videoSource("", "https://restcoderacademy.in")).toBe("");
  });
});

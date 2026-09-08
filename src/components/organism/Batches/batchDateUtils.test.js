import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  parseBatchDate,
  isBatchUpcoming,
  formatBatchDateShort,
  getNextBatchForCourse,
  getNextBatch,
} from "./batchDateUtils";

describe("parseBatchDate", () => {
  it("parses DD-MM-YYYY into the right calendar date", () => {
    const d = parseBatchDate("16-09-2026");
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(8); // September (0-indexed)
    expect(d.getDate()).toBe(16);
  });
  it("returns null for junk and rollover dates", () => {
    for (const bad of ["", null, "31-04-2026", "2026-09-16", "16-13-2026", "abc-09-2026"]) {
      expect(parseBatchDate(bad), String(bad)).toBeNull();
    }
  });
});

describe("isBatchUpcoming", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20)); // 20 Sep 2026
  });
  afterEach(() => vi.useRealTimers());

  it("future date is upcoming", () => {
    expect(isBatchUpcoming("30-09-2026")).toBe(true);
  });
  it("today counts as upcoming", () => {
    expect(isBatchUpcoming("20-09-2026")).toBe(true);
  });
  it("past date is NOT upcoming", () => {
    expect(isBatchUpcoming("16-09-2026")).toBe(false);
  });
  it("unparseable date is NOT upcoming (fails closed)", () => {
    expect(isBatchUpcoming("31-04-2026")).toBe(false);
    expect(isBatchUpcoming("")).toBe(false);
  });
});

describe("formatBatchDateShort", () => {
  it('renders "16 Sep"', () => {
    expect(formatBatchDateShort("16-09-2026")).toBe("16 Sep");
  });
  it("empty string for invalid", () => {
    expect(formatBatchDateShort("nope")).toBe("");
  });
});

describe("getNextBatchForCourse", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20)); // 20 Sep 2026
  });
  afterEach(() => vi.useRealTimers());

  const batches = [
    { name: "Java Full Stack", date: "16-09-2026" }, // past
    { name: "Java Full Stack", date: "14-10-2026" }, // future, later
    { name: "Java Full Stack", date: "30-09-2026" }, // future, earlier -> should win
    { name: "Python Full Stack", date: "23-09-2026" },
  ];

  it("returns the earliest UPCOMING batch for the course", () => {
    expect(getNextBatchForCourse("Java Full Stack", batches).date).toBe("30-09-2026");
  });
  it("returns null when a course has no upcoming batch", () => {
    const onlyPast = [{ name: "MERN Stack", date: "01-01-2020" }];
    expect(getNextBatchForCourse("MERN Stack", onlyPast)).toBeNull();
  });
  it("matches the course name exactly (no fuzzy match)", () => {
    expect(getNextBatchForCourse("java full stack", batches)).toBeNull();
  });
});

describe("getNextBatch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 20)); // 20 Sep 2026
  });
  afterEach(() => vi.useRealTimers());

  const batches = [
    { name: "Java Full Stack", date: "16-09-2026" },   // past
    { name: "MERN Stack", date: "14-10-2026" },        // future, later
    { name: "Python Full Stack", date: "23-09-2026" }, // future, earliest -> wins
  ];

  it("returns the soonest upcoming batch across every course", () => {
    expect(getNextBatch(batches).date).toBe("23-09-2026");
  });
  it("ignores batches that have already started", () => {
    expect(getNextBatch([{ date: "01-01-2020" }])).toBeNull();
  });
  it("returns null for an empty or missing list, so the hero just hides the date", () => {
    expect(getNextBatch([])).toBeNull();
    expect(getNextBatch(undefined)).toBeNull();
  });
  it("skips unparseable dates rather than throwing", () => {
    expect(getNextBatch([{ date: "nope" }, { date: "30-09-2026" }]).date).toBe("30-09-2026");
  });
});

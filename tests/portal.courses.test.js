import { describe, it, expect } from "vitest";
import { onRequestGet as listGet } from "../functions/api/portal/courses.js";
import { onRequestGet as detailGet } from "../functions/api/portal/courses/[slug].js";
import { listEnrolledCourses, getEnrolledCourse } from "../shared/courses.js";
import { signSession } from "../shared/auth.js";

const SECRET = "test-secret-value";

// A fake D1 that records the SQL it was handed and replays canned rows. The
// point is to assert the query shape and the route's behaviour around it, not
// to reimplement SQLite: `plan` maps a matcher to the rows that query returns.
function fakeDB(plan, log = []) {
  return {
    log,
    prepare(sql) {
      const stmt = {
        sql,
        args: [],
        bind(...args) {
          stmt.args = args;
          return stmt;
        },
        async all() {
          log.push({ sql, args: stmt.args });
          return { results: resolve(plan, sql, stmt.args) ?? [] };
        },
        async first() {
          log.push({ sql, args: stmt.args });
          const rows = resolve(plan, sql, stmt.args);
          return rows && rows.length ? rows[0] : null;
        },
      };
      return stmt;
    },
  };
}
function resolve(plan, sql, args) {
  for (const [needle, rows] of plan) {
    if (sql.includes(needle)) return typeof rows === "function" ? rows(args) : rows;
  }
  return [];
}
const throwingDB = () => ({
  prepare() {
    return { bind: () => ({ all: async () => { throw new Error("d1 down"); }, first: async () => { throw new Error("d1 down"); } }) };
  },
});

const session = (uid = 7) => signSession({ uid, email: "s@example.com", name: "S", role: "student" }, SECRET);
const req = (url, token) =>
  new Request(url, { headers: token ? { cookie: `rca_session=${token}` } : {} });

describe("GET /api/portal/courses", () => {
  it("401s without a session, and reads no course data", async () => {
    const log = [];
    const res = await listGet({ request: req("https://x/api/portal/courses"), env: { SESSION_SECRET: SECRET, DB: fakeDB([], log) } });
    expect(res.status).toBe(401);
    expect(log).toHaveLength(0);
  });

  it("401s on a tampered cookie", async () => {
    const token = (await session()) + "x";
    const res = await listGet({ request: req("https://x/api/portal/courses", token), env: { SESSION_SECRET: SECRET, DB: fakeDB([]) } });
    expect(res.status).toBe(401);
  });

  it("returns the student's enrolled courses", async () => {
    const db = fakeDB([["FROM enrolments_users", [{ id: 1, slug: "fde", title: "Full Dev", lesson_count: 3 }]]]);
    const res = await listGet({ request: req("https://x/api/portal/courses", await session()), env: { SESSION_SECRET: SECRET, DB: db } });
    expect(res.status).toBe(200);
    expect((await res.json()).courses).toEqual([{ id: 1, slug: "fde", title: "Full Dev", lesson_count: 3 }]);
  });

  it("scopes the query to the caller's own user id", async () => {
    const log = [];
    const db = fakeDB([["FROM enrolments_users", []]], log);
    await listGet({ request: req("https://x/api/portal/courses", await session(42)), env: { SESSION_SECRET: SECRET, DB: db } });
    expect(log[0].args).toEqual([42]);
    expect(log[0].sql).toContain("eu.user_id = ?1");
  });

  it("never caches a per-student response", async () => {
    const res = await listGet({ request: req("https://x/api/portal/courses", await session()), env: { SESSION_SECRET: SECRET, DB: fakeDB([]) } });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("503s rather than reporting an empty course list when D1 is missing", async () => {
    const res = await listGet({ request: req("https://x/api/portal/courses", await session()), env: { SESSION_SECRET: SECRET } });
    expect(res.status).toBe(503);
  });

  it("503s when the query throws", async () => {
    const res = await listGet({ request: req("https://x/api/portal/courses", await session()), env: { SESSION_SECRET: SECRET, DB: throwingDB() } });
    expect(res.status).toBe(503);
  });
});

describe("GET /api/portal/courses/:slug", () => {
  const enrolled = [
    ["FROM enrolments_users", [{ id: 5, slug: "fde", title: "Full Dev" }]],
    ["FROM lessons", [{ id: 1, position: 1, title: "Intro", notes: "# hi" }]],
  ];

  it("401s without a session", async () => {
    const res = await detailGet({ request: req("https://x/api/portal/courses/fde"), env: { SESSION_SECRET: SECRET, DB: fakeDB(enrolled) }, params: { slug: "fde" } });
    expect(res.status).toBe(401);
  });

  it("returns the course with its lessons in order", async () => {
    const res = await detailGet({ request: req("https://x/api/portal/courses/fde", await session()), env: { SESSION_SECRET: SECRET, DB: fakeDB(enrolled) }, params: { slug: "fde" } });
    expect(res.status).toBe(200);
    const { course } = await res.json();
    expect(course.slug).toBe("fde");
    expect(course.lessons).toHaveLength(1);
  });

  it("404s for a course the student is not enrolled in, and reads no lessons", async () => {
    const log = [];
    const db = fakeDB([["FROM enrolments_users", []], ["FROM lessons", [{ id: 1 }]]], log);
    const res = await detailGet({ request: req("https://x/api/portal/courses/secret", await session()), env: { SESSION_SECRET: SECRET, DB: db }, params: { slug: "secret" } });
    expect(res.status).toBe(404);
    expect(log.some((q) => q.sql.includes("FROM lessons"))).toBe(false);
  });

  it("gives an unenrolled student the same 404 as a nonexistent slug", async () => {
    const db = fakeDB([["FROM enrolments_users", []]]);
    const a = await detailGet({ request: req("https://x/a", await session()), env: { SESSION_SECRET: SECRET, DB: db }, params: { slug: "real-but-not-mine" } });
    const b = await detailGet({ request: req("https://x/b", await session()), env: { SESSION_SECRET: SECRET, DB: db }, params: { slug: "no-such-course" } });
    expect(a.status).toBe(b.status);
    expect(await a.json()).toEqual(await b.json());
  });

  it("404s on an empty slug", async () => {
    const res = await detailGet({ request: req("https://x/api/portal/courses/", await session()), env: { SESSION_SECRET: SECRET, DB: fakeDB(enrolled) }, params: {} });
    expect(res.status).toBe(404);
  });
});

describe("course queries", () => {
  it("withholds an unpublished course even from an enrolled student", async () => {
    const log = [];
    await listEnrolledCourses(fakeDB([], log), 1);
    expect(log[0].sql).toContain("c.published = 1");
  });

  it("counts only published lessons", async () => {
    const log = [];
    await listEnrolledCourses(fakeDB([], log), 1);
    expect(log[0].sql).toContain("l.published = 1");
  });

  it("returns null for a course the student is not enrolled in", async () => {
    expect(await getEnrolledCourse(fakeDB([["FROM enrolments_users", []]]), 1, "fde")).toBeNull();
  });

  it("orders lessons by position", async () => {
    const log = [];
    await getEnrolledCourse(fakeDB([["FROM enrolments_users", [{ id: 5, slug: "fde" }]], ["FROM lessons", []]], log), 1, "fde");
    expect(log[1].sql).toContain("ORDER BY position ASC");
  });
});

// Tests for shared/portalAuth.js — session validation middleware.
// Uses a fake D1 that mirrors the portal_sessions + portal_users schema.
import { describe, it, expect } from "vitest";
import { parseCookie, requirePortalAuth, requireRole, requireParentScope } from "./portalAuth.js";

// ---------------------------------------------------------------------------
// Fake D1 for portal tables
// ---------------------------------------------------------------------------
function makePortalDB({ users = [], sessions = [], parentStudents = [] } = {}) {
  return {
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async first() {
          const s = sql.toLowerCase();
          // resolvePortalSession query
          if (s.includes("from portal_sessions") && s.includes("join portal_users")) {
            const sid = args[0];
            const now = args[1];
            const session = sessions.find(
              (s) => s.id === sid && !s.revoked_at && s.expires_at > now
            );
            if (!session) return null;
            const user = users.find((u) => u.id === session.user_id);
            if (!user) return null;
            return { user_id: user.id, role: user.role };
          }
          // portal_users by id
          if (s.includes("from portal_users") && s.includes("where id")) {
            return users.find((u) => u.id === args[0]) || null;
          }
          // parent_students
          if (s.includes("from parent_students")) {
            const link = parentStudents.find(
              (l) => l.parent_user_id === args[0] && l.student_user_id === args[1]
            );
            return link || null;
          }
          return null;
        },
        async run() {
          // revokePortalSession UPDATE
          if (sql.toLowerCase().includes("update portal_sessions")) {
            const s = sessions.find((s) => s.id === args[1]);
            if (s) s.revoked_at = args[0];
          }
          return { meta: { changes: 1 } };
        },
        async all() { return { results: [] }; },
      };
      return stmt;
    },
  };
}

// Helper to build a fake request with a cookie
function makeRequest(cookieValue) {
  return new Request("https://restcoderacademy.in/auth/me", {
    headers: cookieValue ? { Cookie: `__session=${cookieValue}` } : {},
  });
}

// ---------------------------------------------------------------------------
// parseCookie
// ---------------------------------------------------------------------------
describe("parseCookie", () => {
  it("extracts a named cookie", () => {
    expect(parseCookie("foo=bar; baz=qux", "foo")).toBe("bar");
    expect(parseCookie("foo=bar; baz=qux", "baz")).toBe("qux");
  });
  it("returns null when cookie absent", () => {
    expect(parseCookie("foo=bar", "missing")).toBeNull();
    expect(parseCookie(null, "foo")).toBeNull();
    expect(parseCookie("", "foo")).toBeNull();
  });
  it("handles a single cookie", () => {
    expect(parseCookie("__session=abc123", "__session")).toBe("abc123");
  });
});

// ---------------------------------------------------------------------------
// requirePortalAuth
// ---------------------------------------------------------------------------
const FUTURE = new Date(Date.now() + 3_600_000).toISOString();
const PAST = new Date(Date.now() - 3_600_000).toISOString();

const USER = { id: "user-1", name: "Test User", email: "test@example.com", role: "student", avatar_url: null };
const SESSION_VALID = { id: "sess-valid", user_id: "user-1", expires_at: FUTURE, revoked_at: null };
const SESSION_EXPIRED = { id: "sess-expired", user_id: "user-1", expires_at: PAST, revoked_at: null };
const SESSION_REVOKED = { id: "sess-revoked", user_id: "user-1", expires_at: FUTURE, revoked_at: new Date().toISOString() };

describe("requirePortalAuth", () => {
  it("returns { userId, role } for a valid session", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_VALID] });
    const req = makeRequest("sess-valid");
    const result = await requirePortalAuth(req, { DB: db });
    expect(result).not.toBeInstanceOf(Response);
    expect(result.userId).toBe("user-1");
    expect(result.role).toBe("student");
  });

  it("returns 401 when no cookie", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_VALID] });
    const req = makeRequest(null);
    const result = await requirePortalAuth(req, { DB: db });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(401);
  });

  it("returns 401 for expired session", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_EXPIRED] });
    const req = makeRequest("sess-expired");
    const result = await requirePortalAuth(req, { DB: db });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(401);
  });

  it("returns 401 for revoked session", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_REVOKED] });
    const req = makeRequest("sess-revoked");
    const result = await requirePortalAuth(req, { DB: db });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(401);
  });

  it("returns 401 for a session ID that does not exist", async () => {
    const db = makePortalDB({ users: [USER], sessions: [] });
    const req = makeRequest("nonexistent-session");
    const result = await requirePortalAuth(req, { DB: db });
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(401);
  });

  it("returns 503 when DB not configured", async () => {
    const req = makeRequest("sess-valid");
    const result = await requirePortalAuth(req, {});
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(503);
  });
});

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------
describe("requireRole", () => {
  it("allows matching role", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_VALID] });
    const req = makeRequest("sess-valid");
    const result = await requireRole(req, { DB: db }, "student");
    expect(result).not.toBeInstanceOf(Response);
    expect(result.role).toBe("student");
  });

  it("allows when role is in the allowed list", async () => {
    const admin = { ...USER, id: "user-2", role: "admin" };
    const adminSess = { id: "sess-admin", user_id: "user-2", expires_at: FUTURE, revoked_at: null };
    const db = makePortalDB({ users: [admin], sessions: [adminSess] });
    const req = makeRequest("sess-admin");
    const result = await requireRole(req, { DB: db }, "admin", "instructor");
    expect(result.role).toBe("admin");
  });

  it("returns 403 for wrong role", async () => {
    const db = makePortalDB({ users: [USER], sessions: [SESSION_VALID] });
    const req = makeRequest("sess-valid");
    const result = await requireRole(req, { DB: db }, "admin");
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(403);
  });

  it("returns 401 for missing session", async () => {
    const db = makePortalDB({});
    const req = makeRequest(null);
    const result = await requireRole(req, { DB: db }, "admin");
    expect(result.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// requireParentScope
// ---------------------------------------------------------------------------
describe("requireParentScope", () => {
  const LINK = { parent_user_id: "parent-1", student_user_id: "student-1" };

  it("returns null when parent is linked to student", async () => {
    const db = makePortalDB({ parentStudents: [LINK] });
    const result = await requireParentScope(db, "parent-1", "student-1");
    expect(result).toBeNull();
  });

  it("returns 403 when parent is not linked to student", async () => {
    const db = makePortalDB({ parentStudents: [] });
    const result = await requireParentScope(db, "parent-1", "student-99");
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(403);
  });

  it("returns 403 when link is for different student", async () => {
    const db = makePortalDB({ parentStudents: [LINK] });
    const result = await requireParentScope(db, "parent-1", "student-other");
    expect(result).toBeInstanceOf(Response);
    expect(result.status).toBe(403);
  });
});

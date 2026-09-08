/**
 * Placements: D1-backed list, admin CRUD, and the mapping between them (#145).
 *
 * The site's placements were hardcoded, so publishing one meant a commit, a PR
 * and a deploy — which is why Instagram had many more of them than the site
 * did. These tests cover the three things that has to get right: the public
 * endpoint never breaks the section, the admin gate actually holds, and a row
 * round-trips to the shape the components already read.
 */
import { describe, it, expect } from "vitest";
import { onRequestGet as listGet } from "../functions/api/placements/list.js";
import {
  onRequestGet as adminGet,
  onRequestPost as adminPost,
} from "../functions/admin/placements.js";
import { inputToColumns, rowToRecord, validatePlacement, EDITABLE_FIELDS } from "../shared/placements.js";

const ctx = (request, env) => ({ request, env, params: {} });
const authH = (u = "admin", p = "secret") => ({ Authorization: "Basic " + btoa(`${u}:${p}`) });

const formReq = (url, fields) =>
  new Request(url, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", ...authH() },
    body: new URLSearchParams(fields).toString(),
  });

/** Fake D1 — mocks only prepare/bind/run/all/first, as the existing suite does. */
function makeDB(rows = []) {
  const t = { placements: [...rows] };
  return {
    tables: t,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async all() {
          let out = t.placements;
          if (/is_published = 1/.test(sql)) out = out.filter((p) => p.is_published === 1);
          out = [...out].sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0));
          return { results: out };
        },
        async first() {
          if (/UPDATE placements SET is_published = 1 - is_published/.test(sql)) {
            const row = t.placements.find((p) => p.id === args[0]);
            if (!row) return null;
            row.is_published = row.is_published ? 0 : 1;
            return { is_published: row.is_published };
          }
          return null;
        },
        async run() {
          if (/^INSERT INTO placements/i.test(sql)) {
            const rec = { id: args[0], is_published: 0 };
            EDITABLE_FIELDS.forEach((f, i) => { rec[f] = args[i + 1]; });
            rec.display_order = args[EDITABLE_FIELDS.length + 1];
            t.placements.push(rec);
          } else if (/^UPDATE placements SET name/i.test(sql)) {
            const row = t.placements.find((p) => p.id === args[args.length - 1]);
            if (row) {
              EDITABLE_FIELDS.forEach((f, i) => { row[f] = args[i]; });
              row.display_order = args[EDITABLE_FIELDS.length];
            }
          } else if (/DELETE FROM placements/i.test(sql)) {
            t.placements = t.placements.filter((p) => p.id !== args[0]);
          }
        },
      };
      return stmt;
    },
  };
}

const row = (over = {}) => ({
  id: "p1", name: "Sakshi", designation: "Software Engineer", company_name: "HCL",
  company_logo_url: "bundled:hcl", photo_url: "bundled:sakshi",
  description: "…", is_published: 1, display_order: 10, ...over,
});

// ---------------------------------------------------------------------------
describe("GET /api/placements/list", () => {
  it("returns only published rows, in display order", async () => {
    const db = makeDB([
      row({ id: "b", name: "Second", display_order: 20 }),
      row({ id: "a", name: "First", display_order: 10 }),
      row({ id: "h", name: "Hidden", is_published: 0, display_order: 5 }),
    ]);
    const res = await listGet(ctx(new Request("https://x/api/placements/list"), { DB: db }));
    expect(res.status).toBe(200);
    const { placements } = await res.json();
    expect(placements.map((p) => p.name)).toEqual(["First", "Second"]);
  });

  it("caches for five minutes — this renders on every page view", async () => {
    const res = await listGet(ctx(new Request("https://x/api/placements/list"), { DB: makeDB([row()]) }));
    expect(res.headers.get("cache-control")).toBe("public, max-age=300");
  });

  it("returns an empty list rather than a 500 when D1 throws", async () => {
    // The site falls back to its bundled array on an empty list. A 500 here
    // would turn "slightly stale" into "the section is broken".
    const db = { prepare() { throw new Error("D1 down"); } };
    const res = await listGet(ctx(new Request("https://x/api/placements/list"), { DB: db }));
    expect(res.status).toBe(200);
    expect((await res.json()).placements).toEqual([]);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });

  it("returns an empty list when there is no DB binding at all", async () => {
    const res = await listGet(ctx(new Request("https://x/api/placements/list"), {}));
    expect(res.status).toBe(200);
    expect((await res.json()).placements).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
describe("/admin/placements — the gate", () => {
  const env = (db) => ({ DB: db, ADMIN_PASSWORD: "secret" });

  it("401s without credentials, and with wrong ones", async () => {
    const db = makeDB();
    expect((await adminGet(ctx(new Request("https://x/admin/placements"), env(db)))).status).toBe(401);
    const wrong = new Request("https://x/admin/placements", { headers: { Authorization: "Basic " + btoa("admin:nope") } });
    expect((await adminGet(ctx(wrong, env(db)))).status).toBe(401);
  });

  it("fails closed when ADMIN_PASSWORD is unset", async () => {
    const req = new Request("https://x/admin/placements", { headers: authH() });
    expect((await adminGet(ctx(req, { DB: makeDB() }))).status).toBe(401);
  });

  it("401s an unauthenticated write before it touches the database", async () => {
    const db = makeDB([row()]);
    const req = new Request("https://x/admin/placements", {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: "action=delete&id=p1",
    });
    expect((await adminPost(ctx(req, env(db)))).status).toBe(401);
    expect(db.tables.placements).toHaveLength(1);
  });

  it("escapes a stored testimonial rather than rendering it as markup", async () => {
    const db = makeDB([row({ description: "<script>alert(1)</script>" })]);
    const req = new Request("https://x/admin/placements", { headers: authH() });
    const html = await (await adminGet(ctx(req, env(db)))).text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

// ---------------------------------------------------------------------------
describe("/admin/placements — CRUD", () => {
  const env = (db) => ({ DB: db, ADMIN_PASSWORD: "secret" });

  it("adds a placement, unpublished, so nothing reaches the site unreviewed", async () => {
    const db = makeDB();
    const res = await adminPost(ctx(formReq("https://x/admin/placements", {
      action: "add", name: "Asha", designation: "SDE", company_name: "Infosys", display_order: "5",
    }), env(db)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("ok=");
    expect(db.tables.placements).toHaveLength(1);
    expect(db.tables.placements[0].is_published).toBe(0);
    expect(db.tables.placements[0].name).toBe("Asha");
  });

  it("rejects a record with nothing to render, and writes no row", async () => {
    const db = makeDB();
    const res = await adminPost(ctx(formReq("https://x/admin/placements", { action: "add", name: "Ghost" }), env(db)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("err=");
    expect(db.tables.placements).toHaveLength(0);
  });

  it("accepts an Instagram-embed-only record — the embed is the card", async () => {
    const db = makeDB();
    await adminPost(ctx(formReq("https://x/admin/placements", {
      action: "add", name: "Kota Akshay", instagram_url: "https://www.instagram.com/p/Dc5o-Uatcxz/",
    }), env(db)));
    expect(db.tables.placements).toHaveLength(1);
  });

  it("refuses a javascript: URL in an asset field", async () => {
    const db = makeDB();
    await adminPost(ctx(formReq("https://x/admin/placements", {
      action: "add", name: "A", designation: "d", company_name: "c", photo_url: "javascript:alert(1)",
    }), env(db)));
    expect(db.tables.placements).toHaveLength(0);
  });

  it("toggles publish without re-submitting every other field", async () => {
    // Taking a testimonial down is the urgent case; it must not depend on the
    // rest of the record still validating.
    const db = makeDB([row({ is_published: 1 })]);
    const res = await adminPost(ctx(formReq("https://x/admin/placements", { action: "toggle", id: "p1" }), env(db)));
    expect(res.status).toBe(303);
    expect(db.tables.placements[0].is_published).toBe(0);
    await adminPost(ctx(formReq("https://x/admin/placements", { action: "toggle", id: "p1" }), env(db)));
    expect(db.tables.placements[0].is_published).toBe(1);
  });

  it("updates an existing placement", async () => {
    const db = makeDB([row()]);
    await adminPost(ctx(formReq("https://x/admin/placements", {
      action: "update", id: "p1", name: "Sakshi R", designation: "Senior Engineer",
      company_name: "HCL", display_order: "1",
    }), env(db)));
    expect(db.tables.placements[0].name).toBe("Sakshi R");
    expect(db.tables.placements[0].display_order).toBe(1);
  });

  it("deletes", async () => {
    const db = makeDB([row()]);
    await adminPost(ctx(formReq("https://x/admin/placements", { action: "delete", id: "p1" }), env(db)));
    expect(db.tables.placements).toHaveLength(0);
  });

  it("rejects an unknown action", async () => {
    const db = makeDB([row()]);
    const res = await adminPost(ctx(formReq("https://x/admin/placements", { action: "drop-table", id: "p1" }), env(db)));
    expect(res.headers.get("location")).toContain("err=");
    expect(db.tables.placements).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
describe("row → the shape the components already read", () => {
  it("nests company the way placement.js does", () => {
    expect(rowToRecord(row())).toMatchObject({
      name: "Sakshi",
      designation: "Software Engineer",
      company: { name: "HCL", logo: "bundled:hcl" },
    });
  });

  it("omits empty optional fields instead of emitting nulls", () => {
    // PlacementsPage builds JSON-LD off these; a null journey would emit an
    // empty schema property rather than no property.
    const rec = rowToRecord({ id: "x", name: "A", journey: null, linkedin_url: "" });
    expect("journey" in rec).toBe(false);
    expect("linkedin" in rec).toBe(false);
    expect("company" in rec).toBe(false);
  });

  it("renames linkedin_url and course_slug to what the page reads", () => {
    const rec = rowToRecord({ id: "x", name: "A", linkedin_url: "https://in/a", course_slug: "java" });
    expect(rec.linkedin).toBe("https://in/a");
    expect(rec.courseSlug).toBe("java");
  });

  it("stores a blank field as NULL rather than an empty string", () => {
    const cols = inputToColumns({ name: "A", designation: "  ", journey: "" });
    expect(cols.name).toBe("A");
    expect(cols.designation).toBeNull();
    expect(cols.journey).toBeNull();
  });

  it("accepts bundled: asset keys, which is how the seeded records keep their images", () => {
    expect(validatePlacement({
      name: "A", designation: "d", company_name: "c", photo_url: "bundled:sakshi",
    })).toEqual([]);
  });

  it("rejects an instagram_url that is not an instagram.com link", () => {
    const errs = validatePlacement({ name: "A", instagram_url: "https://evil.test/p/x/" });
    expect(errs.join(" ")).toContain("instagram.com");
  });
});

import { describe, it, expect, vi, afterEach } from "vitest";
import { onRequestPost as enquiryPost } from "../functions/api/enquiry.js";
import { onRequestGet as batchesGet } from "../functions/api/batches.js";
import { onRequestGet as adminGet } from "../functions/admin.js";
import { onRequestPost as batchAdminPost } from "../functions/admin/batches.js";
import { onRequestGet as trainersGet } from "../functions/api/trainers.js";
import { onRequestPost as trainerAdminPost } from "../functions/admin/trainers.js";
import { onRequestPost as enrollOrder } from "../functions/api/enroll/order.js";
import { onRequestPost as enrollVerify } from "../functions/api/enroll/verify.js";
import { onRequestPost as enrollRegister } from "../functions/api/enroll/register.js";

// Fake D1 — mocks only the DB boundary (prepare/bind/run/all), so tests exercise
// the real handler logic without a live database and without flake.
function makeDB(seed = {}) {
  const t = {
    enquiries: [...(seed.enquiries || [])],
    batches: [...(seed.batches || [])],
    trainers: [...(seed.trainers || [])],
    enrollments: [...(seed.enrollments || [])],
  };
  let ids = { enquiries: 1000, batches: 1000, trainers: 2000, enrollments: 3000 };
  return {
    tables: t,
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...a) { args = a; return stmt; },
        async run() {
          if (/INSERT INTO enquiries/i.test(sql))
            t.enquiries.push({ id: ++ids.enquiries, fullname: args[0], mobile: args[1], email: args[2], experience: args[3], message: args[4] });
          else if (/INSERT INTO batches/i.test(sql))
            t.batches.push({ id: ++ids.batches, name: args[0], date: args[1], day: args[2], time: args[3], trainer: args[4], duration: args[5], mode: args[6], contact: args[7], sort_order: args[8], status: args[9] });
          else if (/UPDATE batches/i.test(sql)) {
            const row = t.batches.find((b) => String(b.id) === String(args[args.length - 1]));
            if (row) Object.assign(row, { name: args[0], date: args[1], day: args[2], time: args[3], trainer: args[4], duration: args[5], mode: args[6], contact: args[7], sort_order: args[8], status: args[9] });
          } else if (/DELETE FROM batches/i.test(sql)) {
            t.batches = t.batches.filter((b) => String(b.id) !== String(args[0]));
          } else if (/INSERT INTO trainers/i.test(sql)) {
            t.trainers.push({
              id: ++ids.trainers, name: args[0], title: args[1], photo_url: args[2], experience: args[3],
              expertise: args[4], linkedin_url: args[5], github_url: args[6], instagram_url: args[7],
              facebook_url: args[8], website_url: args[9], certificate_url: args[10], bio: args[11],
              sort_order: args[12], status: args[13],
            });
          } else if (/UPDATE trainers/i.test(sql)) {
            const row = t.trainers.find((b) => String(b.id) === String(args[args.length - 1]));
            if (row)
              Object.assign(row, {
                name: args[0], title: args[1], photo_url: args[2], experience: args[3], expertise: args[4],
                linkedin_url: args[5], github_url: args[6], instagram_url: args[7], facebook_url: args[8],
                website_url: args[9], certificate_url: args[10], bio: args[11], sort_order: args[12], status: args[13],
              });
          } else if (/DELETE FROM trainers/i.test(sql)) {
            t.trainers = t.trainers.filter((b) => String(b.id) !== String(args[0]));
          } else if (/INSERT INTO enrollments/i.test(sql)) {
            // verify.js binds status as a parameter now (#165) — a payment we
            // could not confirm records as needs_review rather than paid — so
            // take it from the args rather than sniffing the SQL for 'paid'.
            if (/razorpay_order_id/.test(sql)) {
              t.enrollments.push({
                id: ++ids.enrollments, fullname: args[0], mobile: args[1], email: args[2], experience: args[3],
                course: args[4], course_name: args[5], batch: args[6], referral: args[7], amount: args[8],
                razorpay_order_id: args[9], razorpay_payment_id: args[10], status: args[11] ?? "paid",
              });
            } else {
              t.enrollments.push({
                id: ++ids.enrollments, fullname: args[0], mobile: args[1], email: args[2], experience: args[3],
                course: args[4], course_name: args[5], batch: args[6], referral: args[7], status: "registered",
              });
            }
          }
          return { success: true };
        },
        async all() {
          if (/FROM batches/i.test(sql)) {
            let rows = t.batches;
            if (/status\s*=\s*'active'/i.test(sql)) rows = rows.filter((b) => (b.status || "active") === "active");
            return { results: rows };
          }
          if (/FROM trainers/i.test(sql)) {
            let rows = t.trainers;
            if (/status\s*=\s*'active'/i.test(sql)) rows = rows.filter((b) => (b.status || "active") === "active");
            return { results: rows };
          }
          if (/FROM enrollments/i.test(sql)) return { results: t.enrollments };
          if (/FROM enquiries/i.test(sql)) return { results: t.enquiries };
          return { results: [] };
        },
        async first() {
          // The only .first() query is the idempotency lookup in verify.js:
          // SELECT id FROM enrollments WHERE razorpay_order_id = ?1
          if (/FROM enrollments/i.test(sql) && /razorpay_order_id\s*=/i.test(sql)) {
            return t.enrollments.find((e) => e.razorpay_order_id === args[0]) || null;
          }
          const r = await stmt.all();
          return (r.results && r.results[0]) || null;
        },
      };
      return stmt;
    },
  };
}
const ctx = (request, env) => ({ request, env });
const authH = (u = "admin", p = "secret") => ({ Authorization: "Basic " + btoa(`${u}:${p}`) });
const jsonReq = (body) =>
  new Request("https://x/api/enquiry", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
const jsonReqTo = (url, body) =>
  new Request(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
async function rzpSign(orderId, paymentId, secret) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
const formReq = (url, obj) =>
  new Request(url, { method: "POST", headers: { ...authH(), "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(obj).toString() });

describe("POST /api/enquiry", () => {
  it("stores a valid enquiry (201)", async () => {
    const db = makeDB();
    const res = await enquiryPost(ctx(jsonReq({ fullname: "Asha", mobile: "9000000000", email: "a@b.c", experience: "Fresher", message: "hi" }), { DB: db }));
    expect(res.status).toBe(201);
    expect(db.tables.enquiries).toHaveLength(1);
    expect(db.tables.enquiries[0].fullname).toBe("Asha");
  });
  it("400 when required fields are missing", async () => {
    const res = await enquiryPost(ctx(jsonReq({ fullname: "", mobile: "" }), { DB: makeDB() }));
    expect(res.status).toBe(400);
  });
  it("400 on invalid JSON body", async () => {
    const req = new Request("https://x/api/enquiry", { method: "POST", body: "not json" });
    const res = await enquiryPost(ctx(req, { DB: makeDB() }));
    expect(res.status).toBe(400);
  });
  it("500 when storage is not configured", async () => {
    const res = await enquiryPost(ctx(jsonReq({ fullname: "A", mobile: "9" }), {}));
    expect(res.status).toBe(500);
  });
});

describe("GET /api/batches", () => {
  it("returns batches as JSON", async () => {
    const db = makeDB({ batches: [{ id: 1, name: "Java Full Stack", date: "16-09-2026" }] });
    const res = await batchesGet(ctx(new Request("https://x/api/batches"), { DB: db }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data[0].name).toBe("Java Full Stack");
  });
  it("fails soft to [] when storage is unavailable", async () => {
    const res = await batchesGet(ctx(new Request("https://x/api/batches"), {}));
    expect(await res.json()).toEqual([]);
  });
  it("returns only ACTIVE batches, with the weekday computed from the date", async () => {
    const db = makeDB({
      batches: [
        { id: 1, name: "Java Full Stack", date: "16-09-2026", day: "WRONGDAY", status: "active" },
        { id: 2, name: "Hidden Course", date: "23-09-2026", status: "hidden" },
      ],
    });
    const data = await (await batchesGet(ctx(new Request("https://x/api/batches"), { DB: db }))).json();
    expect(data).toHaveLength(1); // hidden one excluded
    expect(data[0].name).toBe("Java Full Stack");
    expect(data[0].day).toBe("Wednesday"); // computed — overrides the stored "WRONGDAY"
  });
});

describe("GET /admin (enquiries)", () => {
  const env = (db) => ({ DB: db, ADMIN_PASSWORD: "secret" });
  it("401 without / with wrong credentials", async () => {
    const db = makeDB();
    expect((await adminGet(ctx(new Request("https://x/admin"), env(db)))).status).toBe(401);
    expect((await adminGet(ctx(new Request("https://x/admin", { headers: authH("admin", "wrong") }), env(db)))).status).toBe(401);
  });
  it("401 fail-closed when ADMIN_PASSWORD is unset", async () => {
    const res = await adminGet(ctx(new Request("https://x/admin", { headers: authH() }), { DB: makeDB() }));
    expect(res.status).toBe(401);
  });
  it("200 with correct auth, and escapes a stored-XSS lead message", async () => {
    const db = makeDB({ enquiries: [{ id: 1, fullname: "X", mobile: "9", email: "", experience: "", message: "<script>alert(1)</script>", created_at: "2026-09-20" }] });
    const res = await adminGet(ctx(new Request("https://x/admin", { headers: authH() }), env(db)));
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).not.toContain("<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
  });
});

describe("POST /admin/batches (CRUD)", () => {
  const env = (db) => ({ DB: db, ADMIN_PASSWORD: "secret" });
  it("401 without auth", async () => {
    const req = new Request("https://x/admin/batches", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "action=add" });
    expect((await batchAdminPost(ctx(req, env(makeDB())))).status).toBe(401);
  });
  it("adds a batch with a valid date (303 ok)", async () => {
    const db = makeDB();
    const res = await batchAdminPost(ctx(formReq("https://x/admin/batches", { action: "add", name: "Java Full Stack", date: "16-09-2026", day: "Wednesday", sort_order: "1" }), env(db)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("ok=");
    expect(db.tables.batches).toHaveLength(1);
    expect(db.tables.batches[0].date).toBe("16-09-2026");
  });
  it("rejects an invalid (rollover) date — no row added (303 err)", async () => {
    const db = makeDB();
    const res = await batchAdminPost(ctx(formReq("https://x/admin/batches", { action: "add", name: "Java", date: "31-04-2026" }), env(db)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("err=");
    expect(db.tables.batches).toHaveLength(0);
  });
  it("stores status=hidden and DERIVES the weekday when adding (Pavan's improvements)", async () => {
    const db = makeDB();
    const res = await batchAdminPost(ctx(formReq("https://x/admin/batches", { action: "add", name: "X", date: "16-09-2026", status: "hidden" }), env(db)));
    expect(res.status).toBe(303);
    expect(db.tables.batches).toHaveLength(1);
    expect(db.tables.batches[0].status).toBe("hidden");
    expect(db.tables.batches[0].day).toBe("Wednesday"); // derived from 16-09-2026, not entered
  });
  it("deletes a batch by id", async () => {
    const db = makeDB({ batches: [{ id: 5, name: "X", date: "16-09-2026" }] });
    const res = await batchAdminPost(ctx(formReq("https://x/admin/batches", { action: "delete", id: "5" }), env(db)));
    expect(res.status).toBe(303);
    expect(db.tables.batches).toHaveLength(0);
  });
});

describe("GET /api/trainers", () => {
  it("returns only ACTIVE trainers as JSON", async () => {
    const db = makeDB({
      trainers: [
        { id: 1, name: "Uday Pawar S", title: "Full-Stack Trainer", status: "active" },
        { id: 2, name: "Hidden Person", status: "hidden" },
      ],
    });
    const res = await trainersGet(ctx(new Request("https://x/api/trainers"), { DB: db }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toHaveLength(1); // hidden one excluded
    expect(data[0].name).toBe("Uday Pawar S");
  });
  it("fails soft to [] when storage is unavailable", async () => {
    const res = await trainersGet(ctx(new Request("https://x/api/trainers"), {}));
    expect(await res.json()).toEqual([]);
  });
});

describe("POST /admin/trainers (CRUD)", () => {
  const env = (db) => ({ DB: db, ADMIN_PASSWORD: "secret" });
  it("401 without auth", async () => {
    const req = new Request("https://x/admin/trainers", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "action=add" });
    expect((await trainerAdminPost(ctx(req, env(makeDB())))).status).toBe(401);
  });
  it("adds a trainer with just a name (303 ok) — other fields optional", async () => {
    const db = makeDB();
    const res = await trainerAdminPost(
      ctx(formReq("https://x/admin/trainers", { action: "add", name: "Uday Pawar S", title: "Full-Stack Trainer", linkedin_url: "https://linkedin.com/in/uday" }), env(db))
    );
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("ok=");
    expect(db.tables.trainers).toHaveLength(1);
    expect(db.tables.trainers[0].name).toBe("Uday Pawar S");
    expect(db.tables.trainers[0].linkedin_url).toBe("https://linkedin.com/in/uday");
    expect(db.tables.trainers[0].status).toBe("active");
  });
  it("rejects an add with no name (303 err) — no row added", async () => {
    const db = makeDB();
    const res = await trainerAdminPost(ctx(formReq("https://x/admin/trainers", { action: "add", title: "Trainer" }), env(db)));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toContain("err=");
    expect(db.tables.trainers).toHaveLength(0);
  });
  it("stores status=hidden when set", async () => {
    const db = makeDB();
    await trainerAdminPost(ctx(formReq("https://x/admin/trainers", { action: "add", name: "X", status: "hidden" }), env(db)));
    expect(db.tables.trainers[0].status).toBe("hidden");
  });
  it("deletes a trainer by id", async () => {
    const db = makeDB({ trainers: [{ id: 7, name: "X" }] });
    const res = await trainerAdminPost(ctx(formReq("https://x/admin/trainers", { action: "delete", id: "7" }), env(db)));
    expect(res.status).toBe(303);
    expect(db.tables.trainers).toHaveLength(0);
  });
});

describe("POST /api/enroll/order", () => {
  it("503 when Razorpay keys are not configured (inert until keys)", async () => {
    const res = await enrollOrder(ctx(jsonReqTo("https://x/api/enroll/order", { course: "fde" }), { DB: makeDB() }));
    expect(res.status).toBe(503);
  });
  it("400 for a course that has no online price, even with keys", async () => {
    const env = { DB: makeDB(), RAZORPAY_KEY_ID: "k", RAZORPAY_KEY_SECRET: "s" };
    const res = await enrollOrder(ctx(jsonReqTo("https://x/api/enroll/order", { course: "unknown-course" }), env));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/enroll/register (free interest)", () => {
  it("records a registration (201)", async () => {
    const db = makeDB();
    const res = await enrollRegister(
      ctx(jsonReqTo("https://x/api/enroll/register", { mobile: "9000000000", email: "asha@example.com", course: "java-fs", course_name: "Java Full Stack" }), { DB: db })
    );
    expect(res.status).toBe(201);
    expect(db.tables.enrollments).toHaveLength(1);
    expect(db.tables.enrollments[0].status).toBe("registered");
  });
  it("400 without phone/email", async () => {
    const res = await enrollRegister(ctx(jsonReqTo("https://x/api/enroll/register", { mobile: "" }), { DB: makeDB() }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/enroll/verify", () => {
  const env = (db) => ({ DB: db, RAZORPAY_KEY_SECRET: "sekret" });
  it("400 on an invalid signature — no row written", async () => {
    const db = makeDB();
    const res = await enrollVerify(
      ctx(jsonReqTo("https://x/api/enroll/verify", { razorpay_order_id: "o1", razorpay_payment_id: "p1", razorpay_signature: "bad", course: "fde" }), env(db))
    );
    expect(res.status).toBe(400);
    expect(db.tables.enrollments).toHaveLength(0);
  });
  it("records a verified paid enrolment, idempotently (no duplicate on retry)", async () => {
    const db = makeDB();
    const sig = await rzpSign("o1", "p1", "sekret");
    // The captured payment is the authority on what was bought (#165): the
    // course in the body is only accepted when its price matches this.
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({ order_id: "o1", amount: 5000000, status: "captured" }),
    });
    const body = {
      razorpay_order_id: "o1", razorpay_payment_id: "p1", razorpay_signature: sig,
      course: "fde", course_name: "Forward Deployed Engineering", fullname: "Asha", mobile: "9", email: "a@b.c",
    };
    // Needs the key id too: without it verify.js cannot reach Razorpay to
    // confirm what was paid for, and correctly records needs_review (#165).
    const fullEnv = { ...env(db), RAZORPAY_KEY_ID: "rzp_test_x" };
    const r1 = await enrollVerify(ctx(jsonReqTo("https://x/api/enroll/verify", body), fullEnv));
    expect(r1.status).toBe(200);
    expect(db.tables.enrollments).toHaveLength(1);
    expect(db.tables.enrollments[0].status).toBe("paid");
    expect(db.tables.enrollments[0].amount).toBe(5000000); // what Razorpay captured

    const r2 = await enrollVerify(ctx(jsonReqTo("https://x/api/enroll/verify", body), fullEnv));
    expect(r2.status).toBe(200);
    expect(db.tables.enrollments).toHaveLength(1); // still one — idempotent
  });

  it("records phone + email pulled from the verified Razorpay payment", async () => {
    const db = makeDB();
    const sig = await rzpSign("o9", "p9", "sekret");
    // Razorpay is where the student entered their details (no form on our side).
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({
        email: "student@rzp.test", contact: "+919876500000",
        // A real payment carries these, and #165 now checks them.
        order_id: "o9", amount: 3500000, status: "captured",
      }),
    });
    const res = await enrollVerify(
      ctx(
        jsonReqTo("https://x/api/enroll/verify", {
          razorpay_order_id: "o9", razorpay_payment_id: "p9", razorpay_signature: sig,
          course: "java-fs", course_name: "Java Full Stack",
        }),
        { DB: db, RAZORPAY_KEY_ID: "rzp_test_x", RAZORPAY_KEY_SECRET: "sekret" }
      )
    );
    expect(res.status).toBe(200);
    expect(fetchSpy).toHaveBeenCalledWith(
      "https://api.razorpay.com/v1/payments/p9",
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: expect.stringMatching(/^Basic /) }) })
    );
    expect(db.tables.enrollments[0].email).toBe("student@rzp.test");
    expect(db.tables.enrollments[0].mobile).toBe("+919876500000");
    expect(db.tables.enrollments[0].amount).toBe(3500000);
    fetchSpy.mockRestore();
  });
});

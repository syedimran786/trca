/**
 * What an enrolment row is allowed to claim (#165).
 *
 * Razorpay's signature is an HMAC over `order_id|payment_id` only. It does not
 * cover the course, so a genuine payment for a ₹35,000 course could be
 * re-submitted with `course: "fde"` and recorded as a paid ₹50,000 enrolment
 * with a signature that validates. These tests pin the payment object, not the
 * request body, as the authority on what was bought.
 */
import { describe, it, expect, vi, afterEach } from "vitest";
import { onRequestPost as verifyPost } from "../functions/api/enroll/verify.js";

const SECRET = "test_secret";
const KEY_ID = "rzp_test_key";

async function sign(orderId, paymentId, secret = SECRET) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = await crypto.subtle.sign("HMAC", key, enc.encode(`${orderId}|${paymentId}`));
  return [...new Uint8Array(mac)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function makeDB() {
  const rows = [];
  return {
    rows,
    prepare(sql) {
      let a = [];
      const s = {
        bind(...x) { a = x; return s; },
        async first() { return rows.find((r) => r.razorpay_order_id === a[0]) || null; },
        async run() {
          if (/INSERT INTO enrollments/i.test(sql)) {
            rows.push({
              fullname: a[0], mobile: a[1], email: a[2], course: a[4], course_name: a[5],
              amount: a[8], razorpay_order_id: a[9], razorpay_payment_id: a[10], status: a[11],
            });
          }
        },
      };
      return s;
    },
  };
}

/** Razorpay's payment lookup, answering with whatever the test says it holds. */
const stubPayment = (payment) =>
  vi.stubGlobal("fetch", async () => new Response(JSON.stringify(payment), { status: 200 }));

const call = async (body, db) =>
  verifyPost({
    request: new Request("https://x/api/enroll/verify", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    env: { RAZORPAY_KEY_ID: KEY_ID, RAZORPAY_KEY_SECRET: SECRET, DB: db },
  });

const ORDER = "order_JAVA123";
const PAYMENT = "pay_ABC123";
const JAVA = 3500000;
const FDE = 5000000;

afterEach(() => vi.unstubAllGlobals());

describe("the course has to be the one that was paid for", () => {
  it("rejects a real payment re-submitted against a dearer course", async () => {
    // The exact shape of #165: genuine order, genuine payment, valid signature,
    // swapped course. Before the fix this recorded fde/5000000 as paid.
    stubPayment({ order_id: ORDER, amount: JAVA, status: "captured" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT),
      course: "fde", course_name: "Forward Deployed Engineering",
    }, db);

    expect(res.status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });

  it("accepts the course that matches what was captured", async () => {
    stubPayment({ order_id: ORDER, amount: JAVA, status: "captured", email: "a@b.c", contact: "9000000000" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT),
      course: "java-fs", course_name: "Java Full Stack",
    }, db);

    expect(res.status).toBe(200);
    expect(db.rows[0]).toMatchObject({ course: "java-fs", amount: JAVA, status: "paid" });
  });

  it("records the amount captured, not the price of the claimed course", async () => {
    // A part payment, or a Razorpay-side discount, must not be written up to
    // the sticker price just because the body named that course.
    stubPayment({ order_id: ORDER, amount: JAVA, status: "captured" });
    const db = makeDB();
    await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "java-fs",
    }, db);
    expect(db.rows[0].amount).toBe(JAVA);
    expect(db.rows[0].amount).not.toBe(FDE);
  });

  it("rejects a payment belonging to a different order", async () => {
    stubPayment({ order_id: "order_SOMEONE_ELSE", amount: JAVA, status: "captured" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "java-fs",
    }, db);
    expect(res.status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });

  it("rejects a payment that was authorized but never captured", async () => {
    // Authorized money can still be voided; it is not a paid enrolment.
    stubPayment({ order_id: ORDER, amount: JAVA, status: "authorized" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "java-fs",
    }, db);
    expect(res.status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });

  it("rejects an unknown course, which has no price to match", async () => {
    stubPayment({ order_id: ORDER, amount: JAVA, status: "captured" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "not-a-course",
    }, db);
    expect(res.status).toBe(400);
  });

  it("still rejects a forged signature before any of this", async () => {
    stubPayment({ order_id: ORDER, amount: JAVA, status: "captured" });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: "deadbeef", course: "java-fs",
    }, db);
    expect(res.status).toBe(400);
    expect(db.rows).toHaveLength(0);
  });
});

describe("when Razorpay cannot be reached", () => {
  it("acknowledges the student but does not assert a course", async () => {
    // They have paid. Failing them here would be the worse bug. But we have not
    // confirmed what for, so the row says so instead of guessing.
    vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
    const db = makeDB();
    const res = await call({
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "fde",
    }, db);

    expect(res.status).toBe(200);
    expect((await res.json()).ok).toBe(true);
    expect(db.rows[0].status).toBe("needs_review");
    expect(db.rows[0].course).toBeNull();
    expect(db.rows[0].amount).toBeNull();
  });

  it("is still idempotent — a retry does not add a second row", async () => {
    vi.stubGlobal("fetch", async () => { throw new Error("offline"); });
    const db = makeDB();
    const body = {
      razorpay_order_id: ORDER, razorpay_payment_id: PAYMENT,
      razorpay_signature: await sign(ORDER, PAYMENT), course: "java-fs",
    };
    await call(body, db);
    await call(body, db);
    expect(db.rows).toHaveLength(1);
  });
});

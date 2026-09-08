// POST /api/enroll/verify — verifies a completed Razorpay payment SERVER-SIDE
// (a browser redirect/callback alone can be forged) and records the paid
// enrolment. Idempotent: a retried verify for the same order does not create a
// second row.
import { priceForCourse, verifyRazorpaySignature } from "../../../shared/enroll.js";

export async function onRequestPost(context) {
  const { request, env } = context;
  const keySecret = env.RAZORPAY_KEY_SECRET;
  if (!keySecret) return json({ error: "Payments are not enabled yet." }, 503);
  if (!env.DB) return json({ error: "Storage not configured." }, 500);

  let b;
  try {
    b = await request.json();
  } catch {
    return json({ error: "Bad request." }, 400);
  }

  const orderId = String(b.razorpay_order_id || "");
  const paymentId = String(b.razorpay_payment_id || "");
  const signature = String(b.razorpay_signature || "");

  const valid = await verifyRazorpaySignature(orderId, paymentId, signature, keySecret);
  if (!valid) return json({ error: "Payment could not be verified." }, 400);

  const courseId = String(b.course || "").trim();
  const expected = priceForCourse(courseId);

  // Fetch the payment Razorpay actually captured.
  //
  // Two different jobs, with two different failure rules (#165):
  //
  //   1. Contact details. There is no form on our side — the student types
  //      their phone and email into Razorpay Checkout — so these come from the
  //      payment. Best-effort: a failed lookup must never fail a student who
  //      has paid.
  //
  //   2. WHAT they paid for. Razorpay's signature is an HMAC over
  //      `order_id|payment_id` only; it does not cover the course. So a real
  //      payment for a ₹35,000 course could be re-submitted with
  //      `course: "fde"` and be recorded as a paid ₹50,000 enrolment, with a
  //      signature that validates. The payment object is the only thing that
  //      knows which order was really paid and for how much, so this half
  //      cannot be best-effort.
  let email = str(b.email);
  let mobile = str(b.mobile);
  let captured = null;
  let lookupFailed = false;

  if (env.RAZORPAY_KEY_ID && keySecret) {
    try {
      const pr = await fetch(
        `https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`,
        { headers: { Authorization: "Basic " + btoa(`${env.RAZORPAY_KEY_ID}:${keySecret}`) } }
      );
      if (pr.ok) {
        const p = await pr.json();
        if (p.email) email = str(p.email);
        if (p.contact) mobile = str(p.contact);
        captured = p;
      } else {
        lookupFailed = true;
      }
    } catch {
      lookupFailed = true;
    }
  } else {
    lookupFailed = true;
  }

  if (captured) {
    // The payment must belong to the order the caller named, must be money we
    // actually hold, and must match this course's price. Any mismatch means the
    // body is describing a different purchase than the one that happened.
    const belongsToOrder = String(captured.order_id || "") === orderId;
    const isCaptured = captured.status === "captured";
    const priceMatches = expected !== null && Number(captured.amount) === expected;

    if (!belongsToOrder || !isCaptured || !priceMatches) {
      return json({ error: "Payment could not be verified." }, 400);
    }
  }

  // What we hold, not what the body claimed. Null when we could not confirm.
  const amount = captured ? Number(captured.amount) : null;

  try {
    const existing = await env.DB.prepare(
      "SELECT id FROM enrollments WHERE razorpay_order_id = ?1"
    )
      .bind(orderId)
      .first();
    if (!existing) {
      // When the lookup failed we could not confirm which course was paid for,
      // so the row records the payment without asserting one. `needs_review`
      // rather than `paid` so /admin/enrollments surfaces it: the student has
      // paid either way, and a human reconciles it against Razorpay.
      const status = lookupFailed ? "needs_review" : "paid";
      await env.DB.prepare(
        "INSERT INTO enrollments (fullname, mobile, email, experience, course, course_name, batch, referral, amount, currency, razorpay_order_id, razorpay_payment_id, status) " +
          "VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,'INR',?10,?11,?12)"
      )
        .bind(
          str(b.fullname), mobile, email, str(b.experience),
          lookupFailed ? null : courseId,
          lookupFailed ? null : str(b.course_name),
          str(b.batch), str(b.referral),
          amount, orderId, paymentId, status
        )
        .run();
    }
  } catch {
    // The payment IS verified — never fail the student because our write hiccupped.
    return json({ ok: true, recorded: false });
  }
  return json({ ok: true, recorded: true });
}

const str = (v) => String(v || "").trim().slice(0, 300);

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

// GET /admin/enrollments — password-protected list of enrolments (paid + free
// "register interest"). Same Basic Auth as /admin (ADMIN_PASSWORD, fails closed).
import { escapeHtml, requireAdminAuth } from "../../shared/serverUtil.js";

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page("Storage not configured.", 0, ""), 500);

  let rows = [];
  try {
    const res = await env.DB.prepare(
      "SELECT id, fullname, mobile, email, course, course_name, batch, referral, amount, status, razorpay_payment_id, created_at " +
        "FROM enrollments ORDER BY created_at DESC"
    ).all();
    rows = res.results || [];
  } catch {
    return html(page("Could not load enrolments.", 0, ""), 500);
  }

  const body = rows.length
    ? rows.map(rowHtml).join("")
    : `<tr><td colspan="8" class="empty">No enrolments yet.</td></tr>`;
  return html(page(null, rows.length, body), 200);
}

function rupees(paise) {
  if (typeof paise !== "number") return "—";
  return "₹" + (paise / 100).toLocaleString("en-IN");
}

function rowHtml(r) {
  const paid = r.status === "paid";
  // A payment we could not confirm with Razorpay (#165). The money is real, but
  // we could not check which course it was for, so the row deliberately holds
  // no course and no amount. Rendering it as "registered" like everything else
  // that is not "paid" would show a student who HAS paid as one who has not —
  // it needs its own badge and someone to reconcile it against the Razorpay
  // dashboard using the payment id.
  const review = r.status === "needs_review";
  const badge = paid
    ? `<span class="badge paid">paid</span>`
    : review
      ? `<span class="badge review">needs review</span>`
      : `<span class="badge reg">registered</span>`;
  return (
    "<tr>" +
    `<td>${escapeHtml(r.fullname)}</td>` +
    `<td><a href="tel:${escapeHtml(r.mobile)}">${escapeHtml(r.mobile)}</a></td>` +
    `<td>${r.email ? `<a href="mailto:${escapeHtml(r.email)}">${escapeHtml(r.email)}</a>` : "—"}</td>` +
    `<td>${escapeHtml(r.course_name || r.course) || "<em>unconfirmed</em>"}</td>` +
    `<td>${escapeHtml(r.batch) || "—"}</td>` +
    `<td>${badge}${typeof r.amount === "number" ? ` <span class="amt">${rupees(r.amount)}</span>` : ""}` +
      (review ? ` <span class="pid">${escapeHtml(r.razorpay_payment_id)}</span>` : "") +
      "</td>" +
    `<td>${escapeHtml(r.referral) || "—"}</td>` +
    `<td class="when">${escapeHtml(r.created_at)}</td>` +
    "</tr>"
  );
}

function page(notice, count, body) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Enrolments — Rest Coder Academy</title>
<style>
  :root { --navy:#03084C; --line:#e4e6ef; --muted:#5b6472; }
  * { box-sizing:border-box; }
  body { margin:0; font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif; color:#1b2030; background:#f5f6fa; }
  header { background:var(--navy); color:#fff; padding:1rem 1.25rem; display:flex; align-items:baseline; gap:.75rem; }
  header h1 { font-size:1.1rem; margin:0; }
  header .count { font-size:.85rem; opacity:.8; }
  header a { color:#cdd6ea; font-size:.85rem; margin-left:.5rem; }
  .wrap { padding:1.25rem; overflow-x:auto; }
  table { border-collapse:collapse; width:100%; min-width:820px; background:#fff; border:1px solid var(--line); border-radius:10px; overflow:hidden; }
  th,td { text-align:left; padding:.6rem .8rem; border-bottom:1px solid var(--line); vertical-align:top; font-size:.9rem; }
  th { background:#eef0f6; color:var(--navy); font-weight:600; white-space:nowrap; }
  tr:last-child td { border-bottom:none; }
  a { color:var(--navy); }
  .when { white-space:nowrap; color:var(--muted); }
  .empty { text-align:center; color:var(--muted); padding:2rem; }
  .notice { padding:1rem 1.25rem; color:#b3261e; }
  .badge { font-size:.72rem; font-weight:700; padding:.1rem .45rem; border-radius:999px; text-transform:uppercase; }
  .badge.paid { background:#e7f6ec; color:#1b6b3a; }
  .badge.reg { background:#eef1f8; color:#334; }
  .badge.review { background:#fff4e5; color:#8a5300; }
  .pid { font-family:ui-monospace,monospace; font-size:.72rem; color:#5b6472; white-space:nowrap; }
  .amt { font-weight:600; white-space:nowrap; }
</style></head>
<body>
  <header><h1>Enrolments</h1><span class="count">${count} total</span><a href="/admin/trainers">Trainers</a><a href="/admin/batches">Batches</a><a href="/admin/placements">Placements</a><a href="/admin/founder">Founder</a><a href="/admin">Enquiries →</a></header>
  ${notice ? `<div class="notice">${escapeHtml(notice)}</div>` : ""}
  <div class="wrap">
    <table>
      <thead><tr><th>Name</th><th>Mobile</th><th>Email</th><th>Course</th><th>Batch</th><th>Status</th><th>Referral</th><th>When</th></tr></thead>
      <tbody>${body}</tbody>
    </table>
  </div>
</body></html>`;
}

function html(bodyStr, status) {
  return new Response(bodyStr, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

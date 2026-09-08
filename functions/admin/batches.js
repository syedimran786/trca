// /admin/batches — password-protected batch schedule editor (issue #15).
// GET renders the current batches with an edit form each + an "add" form.
// POST handles add / update / delete, writes to D1, then redirects back.
// Same Basic Auth as /admin (ADMIN_PASSWORD secret, fails closed if unset).
import { escapeHtml, isValidBatchDate, requireAdminAuth, weekdayFromDate } from "../../shared/serverUtil.js";

// `day` is derived from the date (not entered), and `status` is handled separately.
const FIELDS = ["name", "date", "time", "trainer", "duration", "mode", "contact"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page([], "Storage not configured.", null), 500);

  let rows = [];
  try {
    const res = await env.DB.prepare(
      "SELECT id, name, date, day, time, trainer, duration, mode, contact, sort_order, status " +
        "FROM batches ORDER BY sort_order ASC, date ASC"
    ).all();
    rows = res.results || [];
  } catch {
    return html(page([], "Could not load batches.", null), 500);
  }

  const url = new URL(request.url);
  const notice = url.searchParams.get("ok");
  const error = url.searchParams.get("err");
  return html(page(rows, error, notice), 200);
}

export async function onRequestPost(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return redirect(request, "err", "Storage not configured.");

  let form;
  try {
    form = await request.formData();
  } catch {
    return redirect(request, "err", "Bad form submission.");
  }
  const action = form.get("action");
  const id = form.get("id");

  if (action === "delete") {
    if (!id) return redirect(request, "err", "Missing id.");
    await env.DB.prepare("DELETE FROM batches WHERE id = ?1").bind(id).run();
    return redirect(request, "ok", "Batch deleted.");
  }

  // add or update: validate name + date
  const vals = {};
  for (const f of FIELDS) vals[f] = String(form.get(f) || "").trim().slice(0, 200);
  const sort = parseInt(form.get("sort_order"), 10);
  const sortOrder = Number.isFinite(sort) ? sort : 0;

  if (!vals.name) return redirect(request, "err", "Course name is required.");
  if (!isValidBatchDate(vals.date))
    return redirect(request, "err", "Date must be a real date in DD-MM-YYYY format.");

  const day = weekdayFromDate(vals.date); // derived, never entered — can't drift
  const status = form.get("status") === "hidden" ? "hidden" : "active";

  try {
    if (action === "update") {
      if (!id) return redirect(request, "err", "Missing id.");
      await env.DB.prepare(
        "UPDATE batches SET name=?1, date=?2, day=?3, time=?4, trainer=?5, duration=?6, mode=?7, contact=?8, sort_order=?9, status=?10, updated_at=datetime('now') WHERE id=?11"
      )
        .bind(vals.name, vals.date, day, vals.time, vals.trainer, vals.duration, vals.mode, vals.contact, sortOrder, status, id)
        .run();
      return redirect(request, "ok", "Batch updated.");
    }
    if (action === "add") {
      await env.DB.prepare(
        "INSERT INTO batches (name, date, day, time, trainer, duration, mode, contact, sort_order, status) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10)"
      )
        .bind(vals.name, vals.date, day, vals.time, vals.trainer, vals.duration, vals.mode, vals.contact, sortOrder, status)
        .run();
      return redirect(request, "ok", "Batch added.");
    }
  } catch {
    return redirect(request, "err", "Database error — please try again.");
  }
  return redirect(request, "err", "Unknown action.");
}

function redirect(request, key, msg) {
  const u = new URL("/admin/batches", request.url);
  u.searchParams.set(key, msg);
  return Response.redirect(u.toString(), 303);
}

// ---- rendering ----
function page(rows, error, notice) {
  const editRows = rows.map(rowForm).join("");
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Batches — Rest Coder Academy</title>
<style>
  :root { --navy:#03084C; --line:#e4e6ef; --muted:#5b6472; }
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2030;background:#f5f6fa}
  header{background:var(--navy);color:#fff;padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem}
  header h1{font-size:1.1rem;margin:0}
  header a{color:#cdd6ea;font-size:.85rem}
  .wrap{padding:1.25rem;max-width:920px;margin:0 auto}
  .banner{padding:.7rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem}
  .ok{background:#e7f6ec;color:#1b6b3a;border:1px solid #b6e0c4}
  .err{background:#fdecea;color:#b3261e;border:1px solid #f1b5ac}
  .card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:1rem;margin-bottom:1rem}
  .card h2{font-size:.95rem;margin:0 0 .75rem;color:var(--navy)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:.6rem}
  label{display:block;font-size:.72rem;color:var(--muted);margin-bottom:.15rem}
  input{width:100%;padding:.45rem .55rem;border:1px solid var(--line);border-radius:6px;font-size:.9rem}
  .actions{margin-top:.75rem;display:flex;gap:.5rem}
  button{padding:.5rem 1rem;border:none;border-radius:6px;font-weight:600;font-size:.85rem;cursor:pointer}
  .save{background:var(--navy);color:#fff}
  .del{background:#fff;color:#b3261e;border:1px solid #f1b5ac}
  .add h2{color:#1b6b3a}
  .hint{font-size:.75rem;color:var(--muted);margin:.3rem 0 0}
</style></head>
<body>
  <header><h1>Batches</h1><a href="/admin/enrollments">Enrolments</a><a href="/admin/trainers">Trainers</a><a href="/admin/batches">Batches</a><a href="/admin/placements">Placements</a><a href="/admin/founder">Founder</a><a href="/admin">Enquiries →</a></header>
  <div class="wrap">
    ${error ? `<div class="banner err">${escapeHtml(error)}</div>` : ""}
    ${notice ? `<div class="banner ok">${escapeHtml(notice)}</div>` : ""}
    <p class="hint">Dates are <b>DD-MM-YYYY</b> (e.g. 16-09-2026). A batch whose date has passed automatically shows “new dates coming soon” on the site — so it can never advertise a stale date. The course-card “Next batch” tag matches on the <b>exact</b> course name.</p>
    ${editRows || '<div class="card">No batches yet — add one below.</div>'}
    <div class="card add">
      <h2>+ Add a batch</h2>
      <form method="post">
        <input type="hidden" name="action" value="add"/>
        ${fieldGrid({})}
        <div class="actions"><button class="save" type="submit">Add batch</button></div>
      </form>
    </div>
  </div>
</body></html>`;
}

function rowForm(r) {
  return `<div class="card">
    <form method="post">
      <input type="hidden" name="action" value="update"/>
      <input type="hidden" name="id" value="${escapeHtml(r.id)}"/>
      ${fieldGrid(r)}
      <div class="actions">
        <button class="save" type="submit">Save</button>
        <button class="del" type="submit" formaction="/admin/batches" name="action" value="delete" onclick="return confirm('Delete this batch?')">Delete</button>
      </div>
    </form>
  </div>`;
}

function fieldGrid(r) {
  const F = (name, label, ph = "") =>
    `<div><label>${label}</label><input name="${name}" value="${escapeHtml(r[name])}" placeholder="${escapeHtml(ph)}"/></div>`;
  const status = r.status === "hidden" ? "hidden" : "active";
  return `<div class="grid">
    ${F("name", "Course name", "Java Full Stack")}
    ${F("date", "Date (DD-MM-YYYY)", "16-09-2026")}
    ${F("time", "Time", "10:00 AM")}
    ${F("duration", "Duration", "4 months")}
    ${F("mode", "Mode", "offline")}
    ${F("trainer", "Trainer", "Uday pawar S")}
    ${F("contact", "Contact", "8073762257")}
    <div><label>Sort order</label><input name="sort_order" value="${escapeHtml(r.sort_order)}" placeholder="1"/></div>
    <div><label>Status</label><select name="status">
      <option value="active"${status === "active" ? " selected" : ""}>Active (shown on site)</option>
      <option value="hidden"${status === "hidden" ? " selected" : ""}>Hidden</option>
    </select></div>
  </div>`;
}

function html(b, status) {
  return new Response(b, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

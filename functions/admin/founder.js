// /admin/founder — password-protected editor for the founder / About page (one
// record, id = 1). GET renders the form; POST upserts it. Same Basic Auth as the
// rest of /admin (ADMIN_PASSWORD secret, fails closed if unset). Leave the name
// blank to keep the About page hidden; set Status to Hidden to take it down while
// keeping the content.
import { escapeHtml, requireAdminAuth } from "../../shared/serverUtil.js";

const FIELDS = ["name", "title", "tagline", "intro", "story", "mission", "vision", "photo_url", "linkedin_url"];

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page({}, "Storage not configured.", null), 500);

  let row = {};
  try {
    row = (await env.DB.prepare(
      "SELECT name, title, tagline, intro, story, mission, vision, photo_url, linkedin_url, status FROM founder WHERE id = 1"
    ).first()) || {};
  } catch {
    return html(page({}, "Could not load founder content.", null), 500);
  }
  const url = new URL(request.url);
  return html(page(row, url.searchParams.get("err"), url.searchParams.get("ok")), 200);
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

  const vals = {};
  for (const f of FIELDS) vals[f] = String(form.get(f) || "").trim().slice(0, 8000);
  const status = form.get("status") === "hidden" ? "hidden" : "active";

  try {
    await env.DB.prepare(
      "INSERT INTO founder (id, name, title, tagline, intro, story, mission, vision, photo_url, linkedin_url, status, updated_at) " +
        "VALUES (1,?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,datetime('now')) " +
        "ON CONFLICT(id) DO UPDATE SET name=?1, title=?2, tagline=?3, intro=?4, story=?5, mission=?6, " +
        "vision=?7, photo_url=?8, linkedin_url=?9, status=?10, updated_at=datetime('now')"
    )
      .bind(vals.name, vals.title, vals.tagline, vals.intro, vals.story, vals.mission, vals.vision, vals.photo_url, vals.linkedin_url, status)
      .run();
    return redirect(request, "ok", "Founder page saved.");
  } catch {
    return redirect(request, "err", "Database error — please try again.");
  }
}

function redirect(request, key, msg) {
  const u = new URL("/admin/founder", request.url);
  u.searchParams.set(key, msg);
  return Response.redirect(u.toString(), 303);
}

function page(r, error, notice) {
  const status = r.status === "hidden" ? "hidden" : "active";
  const F = (name, label, ph = "") =>
    `<div><label>${label}</label><input name="${name}" value="${escapeHtml(r[name])}" placeholder="${escapeHtml(ph)}"/></div>`;
  const T = (name, label, ph = "") =>
    `<div class="wide"><label>${label}</label><textarea name="${name}" placeholder="${escapeHtml(ph)}">${escapeHtml(r[name])}</textarea></div>`;
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Founder page — Rest Coder Academy</title>
<style>
  :root { --navy:#03084C; --line:#e4e6ef; --muted:#5b6472; }
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2030;background:#f5f6fa}
  header{background:var(--navy);color:#fff;padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem}
  header h1{font-size:1.1rem;margin:0}
  header a{color:#cdd6ea;font-size:.85rem}
  .wrap{padding:1.25rem;max-width:820px;margin:0 auto}
  .banner{padding:.7rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem}
  .ok{background:#e7f6ec;color:#1b6b3a;border:1px solid #b6e0c4}
  .err{background:#fdecea;color:#b3261e;border:1px solid #f1b5ac}
  .card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:1.25rem}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:.7rem}
  label{display:block;font-size:.72rem;color:var(--muted);margin-bottom:.15rem}
  input,textarea,select{width:100%;padding:.45rem .55rem;border:1px solid var(--line);border-radius:6px;font-size:.9rem;font-family:inherit}
  textarea{min-height:5rem;resize:vertical}
  .wide{grid-column:1 / -1}
  .actions{margin-top:1rem}
  button{padding:.55rem 1.3rem;border:none;border-radius:6px;font-weight:600;font-size:.9rem;cursor:pointer;background:var(--navy);color:#fff}
  .hint{font-size:.8rem;color:var(--muted);margin:.3rem 0 1rem;line-height:1.5}
</style></head>
<body>
  <header><h1>Founder page</h1><a href="/admin/enrollments">Enrolments</a><a href="/admin/trainers">Trainers</a><a href="/admin/batches">Batches</a><a href="/admin/placements">Placements</a><a href="/admin/founder">Founder</a><a href="/admin">Enquiries →</a></header>
  <div class="wrap">
    ${error ? `<div class="banner err">${escapeHtml(error)}</div>` : ""}
    ${notice ? `<div class="banner ok">${escapeHtml(notice)}</div>` : ""}
    <p class="hint">This fills the public <b>/about</b> page. The page stays hidden until <b>Name</b> is filled in; empty fields simply don't show. In <b>Story</b>, leave a blank line between paragraphs. Set <b>Status → Hidden</b> to take the page down while keeping the content.</p>
    <div class="card">
      <form method="post">
        <div class="grid">
          ${F("name", "Name", "Uday Pawar S")}
          ${F("title", "Title", "Founder")}
          ${F("tagline", "Headline (H1)", "Why I started Rest Coder Academy")}
          ${F("photo_url", "Photo URL", "/trainers/uday.png")}
          ${F("linkedin_url", "LinkedIn URL", "https://linkedin.com/in/…")}
          <div><label>Status</label><select name="status">
            <option value="active"${status === "active" ? " selected" : ""}>Active (shown on site)</option>
            <option value="hidden"${status === "hidden" ? " selected" : ""}>Hidden</option>
          </select></div>
          ${T("intro", "Intro (short hero paragraph)", "One or two sentences that open the page.")}
          ${T("story", "Story (the main narrative)", "Who Uday is, and why he started Rest Coder Academy. Blank line = new paragraph.")}
          ${T("mission", "Mission", "What the academy is here to do.")}
          ${T("vision", "Vision", "Where it's headed.")}
        </div>
        <div class="actions"><button type="submit">Save founder page</button></div>
      </form>
    </div>
  </div>
</body></html>`;
}

function html(b, status) {
  return new Response(b, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

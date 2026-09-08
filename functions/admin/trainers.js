// /admin/trainers — password-protected trainer-profile editor (trainer credibility).
// GET renders each trainer with an edit form + an "add" form.
// POST handles add / update / delete, writes to D1, then redirects back.
// Same Basic Auth as /admin (ADMIN_PASSWORD secret, fails closed if unset).
import { escapeHtml, requireAdminAuth } from "../../shared/serverUtil.js";

// Text fields, in the order they render. `bio` is a textarea; the rest are inputs.
const FIELDS = [
  "name",
  "title",
  "photo_url",
  "experience",
  "expertise",
  "linkedin_url",
  "github_url",
  "instagram_url",
  "facebook_url",
  "website_url",
  "certificate_url",
  "bio",
];

export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page([], "Storage not configured.", null), 500);

  let rows = [];
  try {
    const res = await env.DB.prepare(
      "SELECT id, name, title, photo_url, experience, expertise, bio, " +
        "linkedin_url, github_url, instagram_url, facebook_url, website_url, certificate_url, sort_order, status " +
        "FROM trainers ORDER BY sort_order ASC, id ASC"
    ).all();
    rows = res.results || [];
  } catch {
    return html(page([], "Could not load trainers.", null), 500);
  }

  const url = new URL(request.url);
  return html(page(rows, url.searchParams.get("err"), url.searchParams.get("ok")), 200);
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
    await env.DB.prepare("DELETE FROM trainers WHERE id = ?1").bind(id).run();
    return redirect(request, "ok", "Trainer removed.");
  }

  // add or update — only `name` is required; everything else is optional.
  const vals = {};
  for (const f of FIELDS) vals[f] = String(form.get(f) || "").trim().slice(0, 2000);
  const sort = parseInt(form.get("sort_order"), 10);
  const sortOrder = Number.isFinite(sort) ? sort : 0;
  const status = form.get("status") === "hidden" ? "hidden" : "active";

  if (!vals.name) return redirect(request, "err", "Trainer name is required.");

  const cols =
    "name=?1, title=?2, photo_url=?3, experience=?4, expertise=?5, linkedin_url=?6, github_url=?7, " +
    "instagram_url=?8, facebook_url=?9, website_url=?10, certificate_url=?11, bio=?12, sort_order=?13, status=?14";
  const args = [
    vals.name, vals.title, vals.photo_url, vals.experience, vals.expertise, vals.linkedin_url,
    vals.github_url, vals.instagram_url, vals.facebook_url, vals.website_url, vals.certificate_url,
    vals.bio, sortOrder, status,
  ];

  try {
    if (action === "update") {
      if (!id) return redirect(request, "err", "Missing id.");
      await env.DB.prepare(
        `UPDATE trainers SET ${cols}, updated_at=datetime('now') WHERE id=?15`
      )
        .bind(...args, id)
        .run();
      return redirect(request, "ok", "Trainer updated.");
    }
    if (action === "add") {
      await env.DB.prepare(
        "INSERT INTO trainers (name, title, photo_url, experience, expertise, linkedin_url, github_url, " +
          "instagram_url, facebook_url, website_url, certificate_url, bio, sort_order, status) " +
          "VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,?14)"
      )
        .bind(...args)
        .run();
      return redirect(request, "ok", "Trainer added.");
    }
  } catch {
    return redirect(request, "err", "Database error — please try again.");
  }
  return redirect(request, "err", "Unknown action.");
}

function redirect(request, key, msg) {
  const u = new URL("/admin/trainers", request.url);
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
<title>Trainers — Rest Coder Academy</title>
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
  .row-head{display:flex;align-items:center;gap:.75rem;margin-bottom:.75rem}
  .row-head img{width:44px;height:44px;border-radius:50%;object-fit:cover;background:#eef}
  .row-head b{color:var(--navy)}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:.6rem}
  label{display:block;font-size:.72rem;color:var(--muted);margin-bottom:.15rem}
  input,textarea,select{width:100%;padding:.45rem .55rem;border:1px solid var(--line);border-radius:6px;font-size:.9rem;font-family:inherit}
  textarea{min-height:3.4rem;resize:vertical}
  .wide{grid-column:1 / -1}
  .actions{margin-top:.75rem;display:flex;gap:.5rem}
  button{padding:.5rem 1rem;border:none;border-radius:6px;font-weight:600;font-size:.85rem;cursor:pointer}
  .save{background:var(--navy);color:#fff}
  .del{background:#fff;color:#b3261e;border:1px solid #f1b5ac}
  .add h2{color:#1b6b3a}
  .hint{font-size:.75rem;color:var(--muted);margin:.3rem 0 1rem}
</style></head>
<body>
  <header><h1>Trainers</h1><a href="/admin/enrollments">Enrolments</a><a href="/admin/trainers">Trainers</a><a href="/admin/batches">Batches</a><a href="/admin/placements">Placements</a><a href="/admin/founder">Founder</a><a href="/admin">Enquiries →</a></header>
  <div class="wrap">
    ${error ? `<div class="banner err">${escapeHtml(error)}</div>` : ""}
    ${notice ? `<div class="banner ok">${escapeHtml(notice)}</div>` : ""}
    <p class="hint">Only <b>Name</b> is required. Fill in what you can source from the trainer's LinkedIn — a photo URL, experience, expertise, and their profile links build the credibility that makes the course worth promoting. Empty fields simply don't show on the site. Set a trainer to <b>Hidden</b> to keep the profile but take it off the site.</p>
    ${editRows || '<div class="card">No trainers yet — add one below.</div>'}
    <div class="card add">
      <h2>+ Add a trainer</h2>
      <form method="post">
        <input type="hidden" name="action" value="add"/>
        ${fieldGrid({})}
        <div class="actions"><button class="save" type="submit">Add trainer</button></div>
      </form>
    </div>
  </div>
</body></html>`;
}

function rowForm(r) {
  const avatar = r.photo_url
    ? `<img src="${escapeHtml(r.photo_url)}" alt=""/>`
    : `<img alt=""/>`;
  return `<div class="card">
    <div class="row-head">${avatar}<b>${escapeHtml(r.name)}</b><span style="color:#5b6472">${escapeHtml(r.title || "")}</span></div>
    <form method="post">
      <input type="hidden" name="action" value="update"/>
      <input type="hidden" name="id" value="${escapeHtml(r.id)}"/>
      ${fieldGrid(r)}
      <div class="actions">
        <button class="save" type="submit">Save</button>
        <button class="del" type="submit" formaction="/admin/trainers" name="action" value="delete" onclick="return confirm('Remove this trainer?')">Delete</button>
      </div>
    </form>
  </div>`;
}

function fieldGrid(r) {
  const F = (name, label, ph = "") =>
    `<div><label>${label}</label><input name="${name}" value="${escapeHtml(r[name])}" placeholder="${escapeHtml(ph)}"/></div>`;
  const status = r.status === "hidden" ? "hidden" : "active";
  return `<div class="grid">
    ${F("name", "Name", "Uday Pawar S")}
    ${F("title", "Title", "Full-Stack Trainer")}
    ${F("experience", "Experience", "8+ years")}
    ${F("expertise", "Expertise (comma-separated)", "Java, Spring Boot, React")}
    ${F("photo_url", "Photo URL", "/trainers/uday.png")}
    ${F("linkedin_url", "LinkedIn URL", "https://linkedin.com/in/…")}
    ${F("github_url", "GitHub URL", "https://github.com/…")}
    ${F("instagram_url", "Instagram URL", "")}
    ${F("facebook_url", "Facebook URL", "")}
    ${F("website_url", "Website URL", "")}
    ${F("certificate_url", "Certificate URL", "/trainers/uday-certificate.pdf")}
    <div><label>Sort order</label><input name="sort_order" value="${escapeHtml(r.sort_order)}" placeholder="1"/></div>
    <div><label>Status</label><select name="status">
      <option value="active"${status === "active" ? " selected" : ""}>Active (shown on site)</option>
      <option value="hidden"${status === "hidden" ? " selected" : ""}>Hidden</option>
    </select></div>
    <div class="wide"><label>Short bio</label><textarea name="bio" placeholder="One or two sentences on their background.">${escapeHtml(r.bio)}</textarea></div>
  </div>`;
}

function html(b, status) {
  return new Response(b, { status, headers: { "content-type": "text/html; charset=utf-8" } });
}

// /admin/placements — publish a placement to the site without a deploy (#145).
//
// Same Basic Auth as the rest of the admin panel (ADMIN_PASSWORD, fails closed
// if unset). GET renders every placement with an edit form each plus an add
// form; POST handles add / update / publish toggle / delete, writes D1, and
// redirects back.
//
// Why this exists: the team announces placements on Instagram the day they
// happen, and nobody runs a commit → PR → deploy cycle to mirror them onto the
// site — so the site's most persuasive section is permanently behind Instagram.
// Publishing here should cost about what posting to Instagram costs.
import { escapeHtml, requireAdminAuth } from "../../shared/serverUtil.js";
import { EDITABLE_FIELDS, inputToColumns, validatePlacement } from "../../shared/placements.js";

const SELECT =
  "SELECT id, name, designation, company_name, company_logo_url, photo_url, " +
  "description, background, journey, linkedin_url, course_slug, instagram_url, " +
  "is_published, display_order FROM placements " +
  "ORDER BY display_order ASC, created_at DESC";

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8", "cache-control": "no-store" },
  });
}

function redirect(request, param, msg) {
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set(param, msg);
  return Response.redirect(url.toString(), 303);
}

// ---------------------------------------------------------------------------
// GET
// ---------------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page([], "Storage not configured.", null), 500);

  let rows = [];
  try {
    rows = (await env.DB.prepare(SELECT).all()).results || [];
  } catch {
    return html(page([], "Could not load placements — has schema-placements.sql been applied?", null), 500);
  }

  const url = new URL(request.url);
  return html(page(rows, url.searchParams.get("err"), url.searchParams.get("ok")), 200);
}

// ---------------------------------------------------------------------------
// POST
// ---------------------------------------------------------------------------
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

  const action = String(form.get("action") || "");
  const id = String(form.get("id") || "");

  try {
    if (action === "delete") {
      if (!id) return redirect(request, "err", "Missing id.");
      await env.DB.prepare("DELETE FROM placements WHERE id = ?1").bind(id).run();
      return redirect(request, "ok", "Placement deleted.");
    }

    // The publish toggle is its own action rather than a checkbox on the edit
    // form: taking a placement down is the urgent case (a student asks for
    // their testimonial to be removed), and it should not require re-submitting
    // and re-validating every other field to do it.
    if (action === "toggle") {
      if (!id) return redirect(request, "err", "Missing id.");
      const res = await env.DB.prepare(
        "UPDATE placements SET is_published = 1 - is_published, updated_at = datetime('now') " +
          "WHERE id = ?1 RETURNING is_published",
      ).bind(id).first();
      if (!res) return redirect(request, "err", "No such placement.");
      return redirect(request, "ok", res.is_published ? "Published to the site." : "Hidden from the site.");
    }

    if (action !== "add" && action !== "update") {
      return redirect(request, "err", "Unknown action.");
    }

    const input = {};
    for (const f of EDITABLE_FIELDS) input[f] = form.get(f);

    const errors = validatePlacement(input);
    if (errors.length) return redirect(request, "err", errors.join(" "));

    const cols = inputToColumns(input);
    const order = parseInt(form.get("display_order"), 10);
    const displayOrder = Number.isFinite(order) ? order : 0;

    if (action === "update") {
      if (!id) return redirect(request, "err", "Missing id.");
      const sets = EDITABLE_FIELDS.map((f, i) => `${f} = ?${i + 1}`).join(", ");
      const n = EDITABLE_FIELDS.length;
      await env.DB.prepare(
        `UPDATE placements SET ${sets}, display_order = ?${n + 1}, ` +
          `updated_at = datetime('now') WHERE id = ?${n + 2}`,
      )
        .bind(...EDITABLE_FIELDS.map((f) => cols[f]), displayOrder, id)
        .run();
      return redirect(request, "ok", "Placement saved.");
    }

    // New placements start unpublished. Curating rather than auto-publishing is
    // the whole reason this is an admin form and not an Instagram sync.
    const cells = EDITABLE_FIELDS.map((_f, i) => `?${i + 2}`).join(", ");
    const n = EDITABLE_FIELDS.length;
    await env.DB.prepare(
      `INSERT INTO placements (id, ${EDITABLE_FIELDS.join(", ")}, display_order, is_published) ` +
        `VALUES (?1, ${cells}, ?${n + 2}, 0)`,
    )
      .bind(crypto.randomUUID(), ...EDITABLE_FIELDS.map((f) => cols[f]), displayOrder)
      .run();
    return redirect(request, "ok", "Added — not on the site until you press Publish.");
  } catch {
    return redirect(request, "err", "Could not save. Check the fields and try again.");
  }
}

// ---------------------------------------------------------------------------
// Render
// ---------------------------------------------------------------------------
const FIELD_LABELS = {
  name: "Student name *",
  designation: "Designation",
  company_name: "Company",
  company_logo_url: "Company logo URL",
  photo_url: "Student photo URL",
  description: "Testimonial (their own words)",
  background: "Background (one line)",
  journey: "Journey (1–3 sentences)",
  linkedin_url: "LinkedIn URL",
  course_slug: "Course slug",
  instagram_url: "Instagram post URL",
};
const LONG = new Set(["description", "background", "journey"]);

function field(f, value) {
  const v = escapeHtml(value == null ? "" : String(value));
  const input = LONG.has(f)
    ? `<textarea name="${f}" rows="${f === "description" ? 4 : 2}">${v}</textarea>`
    : `<input name="${f}" value="${v}"/>`;
  return `<div class="${LONG.has(f) ? "full" : ""}"><label>${escapeHtml(FIELD_LABELS[f])}</label>${input}</div>`;
}

function rowForm(r) {
  const live = r.is_published ? "live" : "hidden";
  return `<form class="card" method="post">
    <input type="hidden" name="id" value="${escapeHtml(r.id)}"/>
    <h2>${escapeHtml(r.name)} <span class="tag ${live}">${live}</span></h2>
    <div class="grid">
      ${EDITABLE_FIELDS.map((f) => field(f, r[f])).join("")}
      <div><label>Display order</label><input name="display_order" value="${escapeHtml(String(r.display_order ?? 0))}"/></div>
    </div>
    <div class="actions">
      <button class="save" name="action" value="update">Save</button>
      <button class="pub" name="action" value="toggle">${r.is_published ? "Hide from site" : "Publish"}</button>
      <button class="del" name="action" value="delete"
        onclick="return confirm('Delete ${escapeHtml(r.name)}? This cannot be undone.')">Delete</button>
    </div>
  </form>`;
}

function page(rows, error, notice) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<meta name="robots" content="noindex, nofollow"/>
<title>Placements — Rest Coder Academy</title>
<style>
  :root { --navy:#03084C; --line:#e4e6ef; --muted:#5b6472; }
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1b2030;background:#f5f6fa}
  header{background:var(--navy);color:#fff;padding:1rem 1.25rem;display:flex;align-items:center;gap:1rem;flex-wrap:wrap}
  header h1{font-size:1.1rem;margin:0}
  header a{color:#cdd6ea;font-size:.85rem}
  .wrap{padding:1.25rem;max-width:920px;margin:0 auto}
  .banner{padding:.7rem 1rem;border-radius:8px;margin-bottom:1rem;font-size:.9rem}
  .ok{background:#e7f6ec;color:#1b6b3a;border:1px solid #b6e0c4}
  .err{background:#fdecea;color:#b3261e;border:1px solid #f1b5ac}
  .card{background:#fff;border:1px solid var(--line);border-radius:10px;padding:1rem;margin-bottom:1rem}
  .card h2{font-size:.95rem;margin:0 0 .75rem;color:var(--navy);display:flex;align-items:center;gap:.5rem}
  .tag{font-size:.68rem;font-weight:700;padding:.1rem .45rem;border-radius:999px;text-transform:uppercase;letter-spacing:.04em}
  .live{background:#e7f6ec;color:#1b6b3a}
  .hidden{background:#eef0f4;color:#5b6472}
  .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:.6rem}
  .grid .full{grid-column:1/-1}
  label{display:block;font-size:.72rem;color:var(--muted);margin-bottom:.15rem}
  input,textarea{width:100%;padding:.45rem .55rem;border:1px solid var(--line);border-radius:6px;font-size:.9rem;font-family:inherit}
  .actions{margin-top:.75rem;display:flex;gap:.5rem;flex-wrap:wrap}
  button{padding:.5rem 1rem;border:none;border-radius:6px;font-weight:600;font-size:.85rem;cursor:pointer}
  .save{background:var(--navy);color:#fff}
  .pub{background:#fff;color:#1b6b3a;border:1px solid #b6e0c4}
  .del{background:#fff;color:#b3261e;border:1px solid #f1b5ac}
  .add h2{color:#1b6b3a}
  .hint{font-size:.75rem;color:var(--muted);margin:.3rem 0 1rem}
</style></head>
<body>
  <header><h1>Placements</h1><a href="/admin/enrollments">Enrolments</a><a href="/admin/trainers">Trainers</a><a href="/admin/batches">Batches</a><a href="/admin/founder">Founder</a><a href="/admin">Enquiries →</a></header>
  <div class="wrap">
    ${error ? `<div class="banner err">${escapeHtml(error)}</div>` : ""}
    ${notice ? `<div class="banner ok">${escapeHtml(notice)}</div>` : ""}
    <p class="hint">A placement needs <b>either</b> an Instagram post URL (the embed carries the photo, company and caption) <b>or</b> a designation and a company. New entries are <b>hidden</b> until you press Publish. Lower display order shows first. Photo and logo take a full URL — the four original records use <code>bundled:</code> keys for images shipped inside the site and are best left alone.</p>
    ${rows.map(rowForm).join("") || '<div class="card">No placements yet — add one below.</div>'}
    <form class="card add" method="post">
      <h2>+ Add a placement</h2>
      <div class="grid">
        ${EDITABLE_FIELDS.map((f) => field(f, "")).join("")}
        <div><label>Display order</label><input name="display_order" value="0"/></div>
      </div>
      <div class="actions"><button class="save" name="action" value="add">Add</button></div>
    </form>
  </div>
</body></html>`;
}

// /admin/portal-users — manage portal users and parent↔student links.
// Same Basic Auth as the rest of the admin panel (ADMIN_PASSWORD secret).
//
// Actions (POST form):
//   add-parent  — pre-create a parent user row so the parent gets role=parent
//                 when they SSO in for the first time (matched by email).
//   link        — create a parent_students row linking two existing users.
//   unlink      — remove a parent_students link (id = parent_students.id).
//   delete-user — remove a portal_users row (cascades to sessions + links).
//
// Part of #112 + #146.
import { escapeHtml, requireAdminAuth } from "../../shared/serverUtil.js";

function html(body, status = 200) {
  return new Response(body, {
    status,
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

function redirect(request, param, msg) {
  const url = new URL(request.url);
  url.search = "";
  url.searchParams.set(param, msg);
  return Response.redirect(url.toString(), 303);
}

// ---------------------------------------------------------------------------
// GET — render the admin page
// ---------------------------------------------------------------------------
export async function onRequestGet(context) {
  const { request, env } = context;
  const auth = requireAdminAuth(request, env);
  if (auth) return auth;
  if (!env.DB) return html(page([], [], "Storage not configured.", null), 500);

  let users = [], links = [];
  try {
    const usersRes = await env.DB.prepare(
      "SELECT id, email, name, role, provider, created_at, last_login_at FROM portal_users ORDER BY created_at DESC"
    ).all();
    users = usersRes.results || [];

    const linksRes = await env.DB.prepare(
      "SELECT ps.id, ps.relation, " +
        "p.email AS parent_email, p.name AS parent_name, " +
        "s.email AS student_email, s.name AS student_name " +
        "FROM parent_students ps " +
        "JOIN portal_users p ON p.id = ps.parent_user_id " +
        "JOIN portal_users s ON s.id = ps.student_user_id " +
        "ORDER BY ps.created_at DESC"
    ).all();
    links = linksRes.results || [];
  } catch {
    return html(page([], [], "Could not load portal users.", null), 500);
  }

  const url = new URL(request.url);
  return html(page(users, links, url.searchParams.get("err"), url.searchParams.get("ok")));
}

// ---------------------------------------------------------------------------
// POST — handle form actions
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

  const action = form.get("action");

  // -- add-parent: pre-create a parent user matched by email at first SSO ---
  if (action === "add-parent") {
    const email = String(form.get("email") || "").trim().toLowerCase();
    const name = String(form.get("name") || "").trim();
    if (!email || !name) return redirect(request, "err", "Email and name are required.");

    // Check email not already taken
    const existing = await env.DB.prepare(
      "SELECT id FROM portal_users WHERE email = ?1"
    ).bind(email).first();
    if (existing) return redirect(request, "err", `${email} already has a portal account.`);

    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    try {
      await env.DB.prepare(
        "INSERT INTO portal_users (id, provider, provider_subject, email, name, role, created_at, last_login_at) " +
          "VALUES (?1, NULL, NULL, ?2, ?3, 'parent', ?4, ?4)"
      ).bind(id, email, name, now).run();
    } catch {
      // UNIQUE constraint on email — can happen on a race between two admin tabs
      return redirect(request, "err", `Could not create account for ${email} — email may already exist.`);
    }
    return redirect(request, "ok", `Parent account created for ${email}. They will receive role=parent on first SSO login.`);
  }

  // -- link: create a parent_students row ---------------------------------
  if (action === "link") {
    const parentId = String(form.get("parent_user_id") || "").trim();
    const studentId = String(form.get("student_user_id") || "").trim();
    const relation = String(form.get("relation") || "").trim().slice(0, 50);
    if (!parentId || !studentId) return redirect(request, "err", "Both parent and student are required.");
    if (parentId === studentId) return redirect(request, "err", "Parent and student must be different users.");

    // Verify both users exist and have correct roles
    const parent = await env.DB.prepare(
      "SELECT role FROM portal_users WHERE id = ?1"
    ).bind(parentId).first();
    if (!parent) return redirect(request, "err", "Parent user not found.");
    if (parent.role !== "parent") return redirect(request, "err", "Selected user does not have the parent role.");

    const student = await env.DB.prepare(
      "SELECT role FROM portal_users WHERE id = ?1"
    ).bind(studentId).first();
    if (!student) return redirect(request, "err", "Student user not found.");

    // Check not already linked
    const dupe = await env.DB.prepare(
      "SELECT id FROM parent_students WHERE parent_user_id = ?1 AND student_user_id = ?2"
    ).bind(parentId, studentId).first();
    if (dupe) return redirect(request, "err", "This parent↔student link already exists.");

    const id = crypto.randomUUID();
    try {
      await env.DB.prepare(
        "INSERT INTO parent_students (id, parent_user_id, student_user_id, relation, created_at) VALUES (?1, ?2, ?3, ?4, ?5)"
      ).bind(id, parentId, studentId, relation || null, new Date().toISOString()).run();
    } catch {
      return redirect(request, "err", "Could not create link — it may already exist.");
    }
    return redirect(request, "ok", "Parent↔student link created.");
  }

  // -- unlink: remove a parent_students row --------------------------------
  if (action === "unlink") {
    const id = String(form.get("id") || "").trim();
    if (!id) return redirect(request, "err", "Missing link id.");
    const res = await env.DB.prepare("DELETE FROM parent_students WHERE id = ?1").bind(id).run();
    if (!res.meta?.changes) return redirect(request, "err", "Link not found.");
    return redirect(request, "ok", "Link removed.");
  }

  // -- delete-user: remove a portal_users row (cascades) ------------------
  if (action === "delete-user") {
    const id = String(form.get("id") || "").trim();
    if (!id) return redirect(request, "err", "Missing user id.");
    const res = await env.DB.prepare("DELETE FROM portal_users WHERE id = ?1").bind(id).run();
    if (!res.meta?.changes) return redirect(request, "err", "User not found.");
    return redirect(request, "ok", "User removed.");
  }

  return redirect(request, "err", "Unknown action.");
}

// ---------------------------------------------------------------------------
// HTML page
// ---------------------------------------------------------------------------
function page(users, links, err, ok) {
  const students = users.filter((u) => u.role === "student");
  const parents = users.filter((u) => u.role === "parent");

  const notice = ok
    ? `<p style="color:#1a7f37;background:#dafbe1;padding:.5rem .75rem;border-radius:4px">${escapeHtml(ok)}</p>`
    : "";
  const error = err
    ? `<p style="color:#cf222e;background:#ffebe9;padding:.5rem .75rem;border-radius:4px">${escapeHtml(err)}</p>`
    : "";

  const userRows = users.length
    ? users.map(
        (u) => `<tr>
          <td style="font-family:monospace;font-size:.75rem">${escapeHtml(u.id.slice(0, 8))}…</td>
          <td>${escapeHtml(u.email)}</td>
          <td>${escapeHtml(u.name)}</td>
          <td><strong>${escapeHtml(u.role)}</strong></td>
          <td>${escapeHtml(u.provider || "—")}</td>
          <td>${escapeHtml((u.last_login_at || "").slice(0, 10))}</td>
          <td>
            <form method="post" style="display:inline" onsubmit="return confirm('Delete this user and all their sessions/links?')">
              <input type="hidden" name="action" value="delete-user">
              <input type="hidden" name="id" value="${escapeHtml(u.id)}">
              <button type="submit" style="color:#cf222e;background:none;border:none;cursor:pointer;padding:0">✕ delete</button>
            </form>
          </td>
        </tr>`
      ).join("")
    : `<tr><td colspan="7" style="color:#666;padding:.5rem">No portal users yet — they appear here after their first SSO login, or after you pre-create a parent below.</td></tr>`;

  const linkRows = links.length
    ? links.map(
        (l) => `<tr>
          <td>${escapeHtml(l.parent_name)} <small style="color:#666">${escapeHtml(l.parent_email)}</small></td>
          <td>${escapeHtml(l.student_name)} <small style="color:#666">${escapeHtml(l.student_email)}</small></td>
          <td>${escapeHtml(l.relation || "—")}</td>
          <td>
            <form method="post" style="display:inline" onsubmit="return confirm('Remove this link?')">
              <input type="hidden" name="action" value="unlink">
              <input type="hidden" name="id" value="${escapeHtml(l.id)}">
              <button type="submit" style="color:#cf222e;background:none;border:none;cursor:pointer;padding:0">✕ unlink</button>
            </form>
          </td>
        </tr>`
      ).join("")
    : `<tr><td colspan="4" style="color:#666;padding:.5rem">No parent↔student links yet.</td></tr>`;

  const parentOptions = parents.map(
    (u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`
  ).join("");
  const studentOptions = students.map(
    (u) => `<option value="${escapeHtml(u.id)}">${escapeHtml(u.name)} (${escapeHtml(u.email)})</option>`
  ).join("");

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>Portal Users — Admin</title>
  <style>
    body{font-family:system-ui,sans-serif;max-width:960px;margin:2rem auto;padding:0 1rem;color:#24292f}
    h1{font-size:1.25rem;margin:0 0 1rem}
    h2{font-size:1rem;margin:1.5rem 0 .5rem;border-bottom:1px solid #d0d7de;padding-bottom:.25rem}
    table{width:100%;border-collapse:collapse;font-size:.875rem}
    th,td{text-align:left;padding:.35rem .5rem;border-bottom:1px solid #d0d7de}
    th{background:#f6f8fa;font-weight:600}
    fieldset{border:1px solid #d0d7de;border-radius:4px;padding:.75rem 1rem;margin:0 0 1rem}
    legend{font-weight:600;padding:0 .25rem}
    label{display:block;font-size:.875rem;margin:.4rem 0 .15rem}
    input,select{width:100%;box-sizing:border-box;padding:.35rem .5rem;border:1px solid #d0d7de;border-radius:4px}
    button[type=submit]{margin-top:.5rem;padding:.4rem 1rem;background:#0969da;color:#fff;border:none;border-radius:4px;cursor:pointer;font-size:.875rem}
    nav{margin-bottom:1.5rem;font-size:.875rem}
    nav a{color:#0969da;text-decoration:none;margin-right:1rem}
  </style>
</head>
<body>
  <nav>
    <a href="/admin">← Admin home</a>
    <a href="/admin/batches">Batches</a>
    <a href="/admin/trainers">Trainers</a>
    <a href="/admin/enrollments">Enrollments</a>
  </nav>
  <h1>Portal Users</h1>
  ${notice}${error}

  <h2>All portal users</h2>
  <table>
    <thead><tr><th>ID</th><th>Email</th><th>Name</th><th>Role</th><th>Provider</th><th>Last login</th><th></th></tr></thead>
    <tbody>${userRows}</tbody>
  </table>

  <h2>Parent↔student links</h2>
  <table>
    <thead><tr><th>Parent</th><th>Student</th><th>Relation</th><th></th></tr></thead>
    <tbody>${linkRows}</tbody>
  </table>

  <h2>Pre-create a parent account</h2>
  <p style="font-size:.875rem;color:#57606a">
    Creates a <code>role=parent</code> row matched by email. When the parent signs in with Google or Microsoft for the first time,
    they will automatically receive the parent role instead of the default student role.
  </p>
  <fieldset>
    <legend>Add parent</legend>
    <form method="post">
      <input type="hidden" name="action" value="add-parent">
      <label>Parent email <input type="email" name="email" required placeholder="parent@example.com"></label>
      <label>Parent name <input type="text" name="name" required placeholder="Ramesh Kumar"></label>
      <button type="submit">Create parent account</button>
    </form>
  </fieldset>

  <h2>Link a parent to a student</h2>
  <p style="font-size:.875rem;color:#57606a">
    Both users must exist in the table above before you can link them.
    The parent must have <strong>role=parent</strong>.
  </p>
  <fieldset>
    <legend>Add link</legend>
    <form method="post">
      <input type="hidden" name="action" value="link">
      <label>Parent
        <select name="parent_user_id" required>
          <option value="">— select parent —</option>
          ${parentOptions || '<option disabled>No parent-role users yet</option>'}
        </select>
      </label>
      <label>Student
        <select name="student_user_id" required>
          <option value="">— select student —</option>
          ${studentOptions || '<option disabled>No student-role users yet</option>'}
        </select>
      </label>
      <label>Relation (optional) <input type="text" name="relation" placeholder="mother / father / guardian"></label>
      <button type="submit">Create link</button>
    </form>
  </fieldset>
</body>
</html>`;
}

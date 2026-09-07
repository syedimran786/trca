// Portal authentication middleware.
// Used by /auth/me, /auth/logout, and any future portal API routes that need
// to know who is logged in before they respond.
//
// Session design: the OIDC callback (#113) stores a random UUID in the
// __session HttpOnly cookie and writes a matching row to portal_sessions.
// This gives us server-side revocation (logout genuinely ends the session)
// without needing to rotate a signing secret.
//
// Part of #114.

const SESSION_COOKIE = "__session";

// ---------------------------------------------------------------------------
// parseCookie — extracts a named cookie value from the Cookie header
// ---------------------------------------------------------------------------
export function parseCookie(header, name) {
  if (!header) return null;
  const match = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1]);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// requirePortalAuth
// ---------------------------------------------------------------------------
// Returns { userId, role } when the request carries a valid, non-expired,
// non-revoked session cookie. Returns a Response (401) otherwise.
//
// Usage in a Pages Function handler:
//
//   const auth = await requirePortalAuth(request, env);
//   if (auth instanceof Response) return auth;
//   // auth.userId and auth.role are now available
//
export async function requirePortalAuth(request, env) {
  if (!env.DB) {
    return new Response(JSON.stringify({ error: "service_unavailable" }), {
      status: 503,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  const sessionId = parseCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (!sessionId) return unauthorized("No session cookie");

  const { resolvePortalSession } = await import("./portalDb.js");
  const session = await resolvePortalSession(env.DB, sessionId);
  if (!session) return unauthorized("Session missing, expired, or revoked");

  return session; // { userId, role }
}

// ---------------------------------------------------------------------------
// requireRole
// ---------------------------------------------------------------------------
// Wraps requirePortalAuth and additionally checks the user's role.
// Returns the auth object or a 401/403 Response.
//
//   const auth = await requireRole(request, env, "admin");
//   if (auth instanceof Response) return auth;
//
export async function requireRole(request, env, ...allowedRoles) {
  const auth = await requirePortalAuth(request, env);
  if (auth instanceof Response) return auth;
  if (!allowedRoles.includes(auth.role)) {
    return new Response(JSON.stringify({ error: "forbidden", role: auth.role }), {
      status: 403,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }
  return auth;
}

// ---------------------------------------------------------------------------
// requireParentScope
// ---------------------------------------------------------------------------
// Guards parent-role data reads: a parent may only read data for students
// they are linked to in parent_students. Returns null when access is allowed,
// or a 403 Response when not.
//
//   const deny = await requireParentScope(env.DB, auth.userId, targetStudentId);
//   if (deny) return deny;
//
export async function requireParentScope(db, parentUserId, studentUserId) {
  const link = await db
    .prepare(
      "SELECT id FROM parent_students WHERE parent_user_id = ?1 AND student_user_id = ?2"
    )
    .bind(parentUserId, studentUserId)
    .first();

  if (!link) {
    return new Response(
      JSON.stringify({ error: "forbidden", reason: "not linked to this student" }),
      { status: 403, headers: { "Content-Type": "application/json; charset=utf-8" } }
    );
  }
  return null; // access allowed
}

// ---------------------------------------------------------------------------
// clearSessionCookie — response header value to expire the session cookie
// ---------------------------------------------------------------------------
export function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------
function unauthorized(reason) {
  return new Response(JSON.stringify({ error: "unauthorized", reason }), {
    status: 401,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

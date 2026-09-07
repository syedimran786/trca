
// GET /auth/me — returns the currently signed-in portal user.
//
// Response 200: { id, name, email, avatar_url, role }
// Response 401: { error: "unauthorized", reason: "..." }
// Response 503: { error: "service_unavailable" }   (DB not configured)
//
// The session is validated against the portal_sessions D1 table — expiry
// and revocation are both checked server-side (see shared/portalAuth.js).
// Part of #114.

import { requirePortalAuth } from "../../shared/portalAuth.js";

export async function onRequestGet(context) {
  const { request, env } = context;

  const auth = await requirePortalAuth(request, env);
  if (auth instanceof Response) return auth;

  // Fetch the full user profile for the validated session
  const user = await env.DB.prepare(
    "SELECT id, name, email, avatar_url, role FROM portal_users WHERE id = ?1"
  )
    .bind(auth.userId)
    .first();

  if (!user) {
    // Session references a user that no longer exists — treat as logged out
    return new Response(JSON.stringify({ error: "unauthorized", reason: "User not found" }), {
      status: 401,
      headers: { "Content-Type": "application/json; charset=utf-8" },
    });
  }

  return new Response(
    JSON.stringify({
      id: user.id,
      name: user.name,
      email: user.email,
      avatar_url: user.avatar_url,
      role: user.role,
    }),
    { status: 200, headers: { "Content-Type": "application/json; charset=utf-8" } }
  );
}

// POST /auth/logout — revokes the current session and clears the cookie.
//
// Response 200: { ok: true }
// Response 401: { error: "unauthorized" }   (no valid session to revoke)
// Response 503: { error: "service_unavailable" }
//
// Revoking the session row means the cookie is useless even if it leaks
// (e.g. via a browser extension or network log) — the DB check will reject it.
// Part of #114.

import { requirePortalAuth, clearSessionCookie, parseCookie } from "../../shared/portalAuth.js";
import { revokePortalSession } from "../../shared/portalDb.js";

const SESSION_COOKIE = "__session";

export async function onRequestPost(context) {
  const { request, env } = context;

  const auth = await requirePortalAuth(request, env);
  if (auth instanceof Response) return auth;

  // Revoke the session row so replay of the cookie is rejected
  const sessionId = parseCookie(request.headers.get("Cookie"), SESSION_COOKIE);
  if (sessionId && env.DB) {
    await revokePortalSession(env.DB, sessionId);
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Set-Cookie": clearSessionCookie(),
    },
  });
}

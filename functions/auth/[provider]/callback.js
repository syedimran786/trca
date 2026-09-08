// GET /auth/:provider/callback — exchange the code, verify the ID token against
// the provider's JWKS, upsert the user in D1, and issue our own session (#42).
import { signSession, sessionCookie, readCookie } from "../../../shared/auth.js";
import { isConfigured, providerConfig, redirectUri, verifyIdToken } from "../../../shared/oidc.js";

const clearTx = (headers) => {
  for (const n of ["rca_oauth_state", "rca_oauth_verifier", "rca_oauth_next"]) {
    headers.append("set-cookie", `${n}=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0`);
  }
};

// Errors go back to the login screen as a code in the query string, so the UI
// can say something useful. Nothing from the provider is echoed into the page.
function fail(reason) {
  const headers = new Headers({ location: `/portal/login?error=${encodeURIComponent(reason)}` });
  clearTx(headers);
  return new Response(null, { status: 302, headers });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const provider = String(params.provider || "");
  if (!isConfigured(provider, env)) return fail("not_configured");

  const url = new URL(request.url);
  // The user pressed "cancel" on the consent screen.
  if (url.searchParams.get("error")) return fail("cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request, "rca_oauth_state");
  const verifier = readCookie(request, "rca_oauth_verifier");
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return fail("bad_state");
  }

  const cfg = providerConfig(provider, env);

  let tokens;
  try {
    const res = await fetch(cfg.token, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        client_id: cfg.clientId,
        client_secret: cfg.clientSecret,
        redirect_uri: redirectUri(request, provider),
        code_verifier: verifier,
      }),
    });
    if (!res.ok) return fail("token_exchange");
    tokens = await res.json();
  } catch {
    return fail("token_exchange");
  }
  if (!tokens.id_token) return fail("token_exchange");

  const claims = await verifyIdToken(tokens.id_token, cfg);
  if (!claims) return fail("bad_token");

  if (!env.DB) return fail("storage");
  let user;
  try {
    await env.DB.prepare(
      "INSERT INTO users (provider, subject, email, name, picture, last_login) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, datetime('now')) " +
        "ON CONFLICT (provider, subject) DO UPDATE SET " +
        "email = excluded.email, name = excluded.name, picture = excluded.picture, " +
        "last_login = datetime('now')",
    )
      .bind(provider, claims.sub, claims.email || null, claims.name || null, claims.picture || null)
      .run();
    const row = await env.DB.prepare(
      "SELECT id, email, name, picture, role FROM users WHERE provider = ?1 AND subject = ?2",
    )
      .bind(provider, claims.sub)
      .first();
    user = row;
  } catch {
    return fail("storage");
  }
  if (!user) return fail("storage");

  const token = await signSession(
    { uid: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role, provider },
    env.SESSION_SECRET,
  );

  const nextRaw = readCookie(request, "rca_oauth_next");
  const next = nextRaw ? decodeURIComponent(nextRaw) : "/portal";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";

  const headers = new Headers({ location: safeNext });
  clearTx(headers);
  headers.append("set-cookie", sessionCookie(token));
  return new Response(null, { status: 302, headers });
}

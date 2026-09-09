// GET /auth/:provider/callback — exchange the code, verify the ID token against
// the provider's JWKS, upsert the user in D1, and issue our own session (#42).
import { signSession, sessionCookie, readCookie } from "../../../shared/auth.js";
import { isConfigured, providerConfig, redirectUri, verifyIdToken } from "../../../shared/oidc.js";
import { mintHandoffCode } from "../../../shared/nativeHandoff.js";

const TX_COOKIES = [
  "rca_oauth_state",
  "rca_oauth_verifier",
  "rca_oauth_nonce",
  "rca_oauth_next",
  "rca_oauth_native",
  "rca_oauth_hc",
];

const clearTx = (headers) => {
  for (const n of TX_COOKIES) {
    headers.append("set-cookie", `${n}=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0`);
  }
};

// Whether this transaction was started by the Android shell (#163). Read from
// the HttpOnly cookie our own /start set, never from this request's query
// string — the callback URL is public and anything could add `native=1` to it.
const isNative = (request) => readCookie(request, "rca_oauth_native") === "1";

/**
 * Errors go back as a code, so the UI can say something useful. Nothing from
 * the provider is echoed into the page.
 *
 * A native flow is failing inside a Custom Tab, where /portal/login would be a
 * dead end: the student would be looking at a login screen in a browser that
 * is not the app, with the app still sitting behind it on its own login
 * screen. So the failure is sent back over the deep link too, and the app
 * shows the message itself.
 */
function fail(request, reason) {
  const location = isNative(request)
    ? `rca://auth/callback?error=${encodeURIComponent(reason)}`
    : `/portal/login?error=${encodeURIComponent(reason)}`;
  const headers = new Headers({ location });
  clearTx(headers);
  return new Response(null, { status: 302, headers });
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const provider = String(params.provider || "");
  if (!isConfigured(provider, env)) return fail(request, "not_configured");

  const url = new URL(request.url);
  // The user pressed "cancel" on the consent screen.
  if (url.searchParams.get("error")) return fail(request, "cancelled");

  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const expectedState = readCookie(request, "rca_oauth_state");
  const verifier = readCookie(request, "rca_oauth_verifier");
  if (!code || !state || !expectedState || state !== expectedState || !verifier) {
    return fail(request, "bad_state");
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
    if (!res.ok) return fail(request, "token_exchange");
    tokens = await res.json();
  } catch {
    return fail(request, "token_exchange");
  }
  if (!tokens.id_token) return fail(request, "token_exchange");

  // The nonce cookie is set by our own start endpoint, so a request that
  // arrives without one did not begin here (#159).
  const expectedNonce = readCookie(request, "rca_oauth_nonce");
  if (!expectedNonce) return fail(request, "bad_state");

  const claims = await verifyIdToken(tokens.id_token, cfg, fetch, expectedNonce);
  if (!claims) return fail(request, "bad_token");

  if (!env.DB) return fail(request, "storage");
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
    return fail(request, "storage");
  }
  if (!user) return fail(request, "storage");

  const token = await signSession(
    { uid: user.id, email: user.email, name: user.name, picture: user.picture, role: user.role, provider },
    env.SESSION_SECRET,
  );

  const nextRaw = readCookie(request, "rca_oauth_next");
  const next = nextRaw ? decodeURIComponent(nextRaw) : "/portal";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/portal";

  // --- Native shell: hand the session over, do not set a cookie here (#163).
  //
  // We are running in the system browser. Setting the session cookie now would
  // put a live 30-day session in a cookie jar the app never reads and the
  // student never sees — useless to them and a real credential sitting outside
  // the app. So the browser gets no cookie at all: it gets a one-time code,
  // and the app exchanges it for the cookie from inside its own WebView.
  if (isNative(request)) {
    const challenge = readCookie(request, "rca_oauth_hc");
    // Set together by /start, so one without the other is not a state we can
    // mint against.
    if (!challenge) return fail(request, "bad_state");

    // Named apart from the `code` above: that one is the provider's
    // authorization code, already spent. This is ours, and means something else.
    let handoffCode;
    try {
      handoffCode = await mintHandoffCode(env.DB, token, challenge);
    } catch {
      return fail(request, "storage");
    }

    // `next` rides along so the app lands where the student was headed. It has
    // already been narrowed to a same-site path above.
    const deepLink = new URL("rca://auth/callback");
    deepLink.searchParams.set("code", handoffCode);
    deepLink.searchParams.set("next", safeNext);

    const headers = new Headers({ location: deepLink.toString() });
    clearTx(headers);
    return new Response(null, { status: 302, headers });
  }

  const headers = new Headers({ location: safeNext });
  clearTx(headers);
  headers.append("set-cookie", sessionCookie(token));
  return new Response(null, { status: 302, headers });
}

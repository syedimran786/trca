// GET /auth/:provider/callback — handles the OIDC Authorization Code callback.
//
// 1. Validates the state parameter against the signed HttpOnly cookie.
// 2. Exchanges the authorization code for tokens (server-side, never in the browser).
// 3. Verifies the ID token signature against the provider JWKS + validates
//    issuer, audience, expiry, and nonce. Never trusts an unverified token.
// 4. Upserts the user in D1 via portalDb.upsertPortalUser.
// 5. Creates a session row and sets a signed session cookie.
// 6. Redirects to the correct portal page for the user's role.
//
// Inert-until-configured: missing secrets → 503, missing DB → 503.
// Part of #113.

import { PROVIDER_CONFIG, verifyStateCookie, verifyIdToken } from "../../../shared/oidc.js";
import { upsertPortalUser, createPortalSession } from "../../../shared/portalDb.js";

const STATE_COOKIE = "__oidc_state";
const SESSION_COOKIE = "__session";
const SESSION_TTL_S = 60 * 60 * 24 * 7; // 7 days

// Role → post-login redirect
const ROLE_REDIRECT = {
  student: "/portal/home",
  instructor: "/portal/teach",
  admin: "/portal/admin",
  parent: "/portal/parent",
};

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const provider = params.provider;

  const config = PROVIDER_CONFIG[provider];
  if (!config) return notConfigured(`Unknown provider: ${provider}`);

  const clientId = env[config.clientIdEnv];
  const clientSecret = env[config.clientSecretEnv];
  if (!clientId || !clientSecret) return notConfigured(`${provider} secrets not configured`);

  const cookieSecret = env.COOKIE_SECRET;
  if (!cookieSecret) return notConfigured("COOKIE_SECRET not configured");

  if (!env.DB) return notConfigured("Database not configured");

  // Parse the callback query parameters
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const stateParam = url.searchParams.get("state");
  const errorParam = url.searchParams.get("error");
  const errorDesc = url.searchParams.get("error_description");

  if (errorParam) {
    return loginFailed(`Provider error: ${errorParam}${errorDesc ? ` — ${errorDesc}` : ""}`);
  }
  if (!code || !stateParam) return loginFailed("Missing code or state in callback");

  // Validate the signed state cookie
  const cookieHeader = request.headers.get("Cookie") || "";
  const cookieMatch = cookieHeader.match(
    new RegExp(`(?:^|;\\s*)${STATE_COOKIE}=([^;]+)`)
  );
  const rawCookie = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null;

  const statePayload = await verifyStateCookie(rawCookie, cookieSecret);
  if (!statePayload) return loginFailed("State cookie missing, expired, or invalid");
  if (statePayload.state !== stateParam) return loginFailed("State parameter mismatch");
  if (statePayload.provider !== provider) return loginFailed("Provider mismatch in state cookie");

  const { codeVerifier, nonce, redirectUri } = statePayload;

  // Exchange authorization code for tokens (server-side)
  let tokenData;
  try {
    const tokenRes = await fetch(config.tokenEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: clientId,
        client_secret: clientSecret,
        code_verifier: codeVerifier,
      }),
    });
    if (!tokenRes.ok) {
      const body = await tokenRes.text();
      throw new Error(`HTTP ${tokenRes.status}: ${body.slice(0, 200)}`);
    }
    tokenData = await tokenRes.json();
  } catch (e) {
    return loginFailed(`Token exchange failed: ${e.message}`);
  }

  const idToken = tokenData.id_token;
  if (!idToken) return loginFailed("No id_token in token response");

  // Verify the ID token against the provider JWKS
  let claims;
  try {
    claims = await verifyIdToken(idToken, provider, clientId, nonce);
  } catch (e) {
    return loginFailed(`ID token verification failed: ${e.message}`);
  }

  // Extract user identity from verified claims
  const email = claims.email;
  const providerSubject = claims.sub;
  if (!email || !providerSubject) {
    return loginFailed("ID token missing email or sub claim");
  }
  const name = claims.name || email.split("@")[0];
  const avatarUrl = claims.picture || null;

  // Upsert user in D1 (three-case logic — see shared/portalDb.js)
  let userInfo;
  try {
    userInfo = await upsertPortalUser(env.DB, {
      provider,
      providerSubject,
      email,
      name,
      avatarUrl,
    });
  } catch (e) {
    return loginFailed(`User upsert failed: ${e.message}`);
  }

  // Create a session and get its id for the cookie
  let sessionId;
  try {
    sessionId = await createPortalSession(env.DB, userInfo.id);
  } catch (e) {
    return loginFailed(`Session creation failed: ${e.message}`);
  }

  // Redirect to the correct portal page for this role
  const destination = ROLE_REDIRECT[userInfo.role] || "/portal/home";

  // Clear the OIDC state cookie and set the session cookie
  const headers = new Headers();
  headers.set("Location", destination);
  // Clear state cookie
  headers.append(
    "Set-Cookie",
    `${STATE_COOKIE}=; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=0`
  );
  // Set session cookie
  headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${sessionId}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${SESSION_TTL_S}`
  );

  return new Response(null, { status: 302, headers });
}

// 503 for missing config — callers know what to do when secrets aren't set yet
function notConfigured(reason) {
  return new Response(JSON.stringify({ error: "not_configured", reason }), {
    status: 503,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// Login failures show an inline page — avoids leaking error details into the
// URL bar and doesn't require the React app to handle auth errors.
function loginFailed(reason) {
  // Log server-side (Cloudflare Workers Logpush)
  console.error("[auth/callback]", reason);
  return new Response(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Sign-in failed — Rest Coder Academy</title>
  <meta name="robots" content="noindex">
  <style>
    body{font-family:system-ui,sans-serif;display:flex;flex-direction:column;
         align-items:center;justify-content:center;min-height:100vh;margin:0;
         background:#fff9f9;color:#24292f;text-align:center;padding:1rem}
    h1{font-size:1.25rem;margin:0 0 .5rem;color:#cf222e}
    p{color:#57606a;max-width:36ch;margin:.5rem auto;font-size:.9rem}
    a{color:#0969da;font-size:.875rem}
  </style>
</head>
<body>
  <h1>Sign-in failed</h1>
  <p>We couldn't complete your login. Please try again.</p>
  <a href="/">← Back to Rest Coder Academy</a>
</body>
</html>`,
    { status: 400, headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

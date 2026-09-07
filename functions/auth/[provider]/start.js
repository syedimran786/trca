// GET /auth/:provider/start — initiates the OIDC Authorization Code + PKCE flow.
//
// 1. Validates the provider (google | microsoft) and that secrets are configured.
// 2. Generates a random state + PKCE code_verifier + nonce.
// 3. Signs {state, codeVerifier, nonce, provider, exp} into a short-lived
//    HttpOnly cookie so the callback can verify them.
// 4. Redirects the browser to the provider's authorization endpoint.
//
// Inert-until-configured: missing secrets → 503 "not configured", never 500.
// Part of #113.

import {
  PROVIDER_CONFIG,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateNonce,
  signStateCookie,
} from "../../../shared/oidc.js";

const STATE_COOKIE = "__oidc_state";
const STATE_COOKIE_TTL_S = 600; // 10 minutes — enough to complete the login

export async function onRequestGet(context) {
  const { params, env, request } = context;
  const provider = params.provider;

  const config = PROVIDER_CONFIG[provider];
  if (!config) return notConfigured(`Unknown provider: ${provider}`);

  const clientId = env[config.clientIdEnv];
  if (!clientId) return notConfigured(`${provider} client ID not configured`);

  const cookieSecret = env.COOKIE_SECRET;
  if (!cookieSecret) return notConfigured("COOKIE_SECRET not configured");

  // Derive redirect URI from the current request origin so this works in
  // local Wrangler dev (http://localhost:8788) and production alike.
  // The OAuth app registration must list all origins you'll use.
  const origin = new URL(request.url).origin;
  const redirectUri = `${origin}/auth/${provider}/callback`;

  // PKCE + state + nonce
  const codeVerifier = generateCodeVerifier();
  const [codeChallenge, state, nonce] = await Promise.all([
    generateCodeChallenge(codeVerifier),
    Promise.resolve(generateState()),
    Promise.resolve(generateNonce()),
  ]);

  // Sign state payload into a short-lived HttpOnly cookie
  const cookiePayload = {
    state,
    codeVerifier,
    nonce,
    provider,
    redirectUri, // store so callback can use the same value (must match exactly)
    exp: Date.now() + STATE_COOKIE_TTL_S * 1000,
  };
  const cookieValue = await signStateCookie(cookiePayload, cookieSecret);

  // Build authorization URL
  const authParams = new URLSearchParams({
    client_id: clientId,
    response_type: "code",
    scope: config.scope,
    redirect_uri: redirectUri,
    state,
    nonce,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
    // Lets users pick which account when multiple are signed in
    prompt: "select_account",
  });

  return new Response(null, {
    status: 302,
    headers: {
      Location: `${config.authEndpoint}?${authParams}`,
      "Set-Cookie": `${STATE_COOKIE}=${cookieValue}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=${STATE_COOKIE_TTL_S}`,
    },
  });
}

function notConfigured(reason) {
  return new Response(JSON.stringify({ error: "not_configured", reason }), {
    status: 503,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

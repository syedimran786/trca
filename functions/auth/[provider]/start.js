// GET /auth/:provider/start — begin the Authorization Code + PKCE flow (#42).
//
// The verifier and the CSRF state are held in short-lived HttpOnly cookies
// rather than in a store: they only have to survive the round trip to the
// provider and back to /callback on this same origin.
import { codeChallenge, isConfigured, providerConfig, randomString, redirectUri } from "../../../shared/oidc.js";

const TX_TTL = 600; // 10 minutes is longer than any real consent screen takes

function txCookie(name, value) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/auth; Max-Age=${TX_TTL}`;
}

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const provider = String(params.provider || "");

  // Inert until configured: no client id, no redirect to a provider error page.
  if (!isConfigured(provider, env)) {
    return new Response(
      JSON.stringify({ error: "not_configured", provider }),
      { status: 503, headers: { "content-type": "application/json" } },
    );
  }

  const cfg = providerConfig(provider, env);
  const state = randomString(16);
  const verifier = randomString(32);
  const challenge = await codeChallenge(verifier);

  // Where to land inside the app afterwards. Only a same-site path is kept —
  // an absolute URL here would make this an open redirect.
  const requested = new URL(request.url).searchParams.get("next") || "/portal";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/portal";

  const url = new URL(cfg.authorize);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", redirectUri(request, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  // Ask for an account chooser rather than silently reusing whichever account
  // the phone happens to be signed into.
  url.searchParams.set("prompt", "select_account");

  const headers = new Headers({ location: url.toString() });
  headers.append("set-cookie", txCookie("rca_oauth_state", state));
  headers.append("set-cookie", txCookie("rca_oauth_verifier", verifier));
  headers.append("set-cookie", txCookie("rca_oauth_next", encodeURIComponent(next)));
  return new Response(null, { status: 302, headers });
}

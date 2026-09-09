// GET /auth/:provider/start — begin the Authorization Code + PKCE flow (#42).
//
// The verifier and the CSRF state are held in short-lived HttpOnly cookies
// rather than in a store: they only have to survive the round trip to the
// provider and back to /callback on this same origin.
import { codeChallenge, isConfigured, providerConfig, randomString, redirectUri } from "../../../shared/oidc.js";

const TX_TTL = 600; // 10 minutes is longer than any real consent screen takes

// A base64url SHA-256 digest and nothing else. The value is echoed back into a
// D1 row, so it is pinned to an exact shape here rather than trusted for being
// short.
const S256_B64URL = /^[A-Za-z0-9_-]{43}$/;

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
  // Binds the ID token to this browser (#159). PKCE already blocks replay of
  // the code; the nonce is what stops a token minted elsewhere being swapped
  // in at the callback.
  const nonce = randomString(16);

  // Where to land inside the app afterwards. Only a same-site path is kept —
  // an absolute URL here would make this an open redirect.
  const query = new URL(request.url).searchParams;
  const requested = query.get("next") || "/portal";
  const next = requested.startsWith("/") && !requested.startsWith("//") ? requested : "/portal";

  // Is this flow being run for the Android shell (#163)?
  //
  // The app opens this URL in a Custom Tab and presents `hc` — the SHA-256 of
  // a verifier it generated and kept. Both are recorded in the transaction
  // cookies now, so the callback reads them from a jar only this origin can
  // write (HttpOnly, Path=/auth) rather than from its own query string, which
  // anything that can reach the callback could supply. That is the same
  // unforgeability the ticket asked for from `state`, using the mechanism the
  // rest of this transaction already uses.
  //
  // A malformed or absent challenge means the flow simply is not native: it
  // completes as a normal web sign-in rather than failing. The only way to
  // reach the deep-link branch is to have presented a well-formed one.
  const handoffChallenge = query.get("hc");
  const native = query.get("native") === "1" && S256_B64URL.test(String(handoffChallenge));

  const url = new URL(cfg.authorize);
  url.searchParams.set("client_id", cfg.clientId);
  url.searchParams.set("redirect_uri", redirectUri(request, provider));
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", cfg.scope);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("nonce", nonce);
  // Ask for an account chooser rather than silently reusing whichever account
  // the phone happens to be signed into.
  url.searchParams.set("prompt", "select_account");

  const headers = new Headers({ location: url.toString() });
  headers.append("set-cookie", txCookie("rca_oauth_state", state));
  headers.append("set-cookie", txCookie("rca_oauth_verifier", verifier));
  headers.append("set-cookie", txCookie("rca_oauth_nonce", nonce));
  headers.append("set-cookie", txCookie("rca_oauth_next", encodeURIComponent(next)));
  if (native) {
    headers.append("set-cookie", txCookie("rca_oauth_native", "1"));
    headers.append("set-cookie", txCookie("rca_oauth_hc", handoffChallenge));
  }
  return new Response(null, { status: 302, headers });
}

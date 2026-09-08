// Provider configuration and the PKCE helpers for the student portal's
// Authorization Code flow (#42). No third-party auth SDK — this is hand-rolled
// against Google's and Microsoft's OIDC endpoints so the portal owns its
// sessions on the Cloudflare stack.

export const PROVIDERS = {
  google: {
    label: "Google",
    authorize: "https://accounts.google.com/o/oauth2/v2/auth",
    token: "https://oauth2.googleapis.com/token",
    jwks: "https://www.googleapis.com/oauth2/v3/certs",
    issuers: ["https://accounts.google.com", "accounts.google.com"],
    scope: "openid email profile",
    clientId: (env) => env.GOOGLE_CLIENT_ID,
    clientSecret: (env) => env.GOOGLE_CLIENT_SECRET,
  },
  microsoft: {
    label: "Microsoft",
    // `common` lets both work and personal accounts sign in; MS_TENANT can pin
    // it to one directory later without touching this file.
    authorize: (env) =>
      `https://login.microsoftonline.com/${env.MS_TENANT || "common"}/oauth2/v2.0/authorize`,
    token: (env) =>
      `https://login.microsoftonline.com/${env.MS_TENANT || "common"}/oauth2/v2.0/token`,
    jwks: (env) =>
      `https://login.microsoftonline.com/${env.MS_TENANT || "common"}/discovery/v2.0/keys`,
    // Microsoft's issuer carries the signing tenant's id, which is not known
    // ahead of time under `common`, so it is checked by shape.
    issuers: null,
    scope: "openid email profile",
    clientId: (env) => env.MS_CLIENT_ID,
    clientSecret: (env) => env.MS_CLIENT_SECRET,
  },
};

const val = (v, env) => (typeof v === "function" ? v(env) : v);

export function providerConfig(name, env) {
  const p = PROVIDERS[name];
  if (!p) return null;
  return {
    name,
    label: p.label,
    authorize: val(p.authorize, env),
    token: val(p.token, env),
    jwks: val(p.jwks, env),
    issuers: p.issuers,
    scope: p.scope,
    clientId: p.clientId(env),
    clientSecret: p.clientSecret(env),
    // Needed to enforce the issuer when a tenant is pinned (#160).
    tenant: (env && env.MS_TENANT) || null,
  };
}

/**
 * Whether a provider can actually be used right now.
 *
 * The portal is inert until configured (#42): with no client id and secret the
 * login screen says "coming soon" rather than showing a button that leads to a
 * provider error page. This is the single check behind that.
 */
export function isConfigured(name, env) {
  const c = providerConfig(name, env);
  return Boolean(c && c.clientId && c.clientSecret && env && env.SESSION_SECRET);
}

export function configuredProviders(env) {
  return Object.keys(PROVIDERS).filter((n) => isConfigured(n, env));
}

// --- PKCE ------------------------------------------------------------------

function b64url(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function randomString(bytes = 32) {
  return b64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export async function codeChallenge(verifier) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return b64url(digest);
}

/**
 * Where the provider sends the browser back to.
 *
 * Always this site's own origin, never the `rca://` deep link: a custom scheme
 * cannot be a registered OAuth redirect for a confidential client, and the
 * token exchange has to happen server-side anyway. The native shell is handed
 * back at the end of the callback instead — see functions/auth/[provider]/callback.
 */
export function redirectUri(request, provider) {
  return `${new URL(request.url).origin}/auth/${provider}/callback`;
}

// --- ID token verification -------------------------------------------------

function parseJwt(token) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const pad = (s) => s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  try {
    return {
      header: JSON.parse(atob(pad(parts[0]))),
      payload: JSON.parse(atob(pad(parts[1]))),
      signed: `${parts[0]}.${parts[1]}`,
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

function bytesFromB64url(s) {
  const p = s.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((s.length + 3) % 4);
  const bin = atob(p);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

/**
 * Verify an ID token against the provider's JWKS.
 *
 * The signature check is the point: without it, anyone who can reach the
 * callback could post a self-made token and be issued a session. Fails closed —
 * every error path returns null rather than a partially trusted payload.
 */
// --- JWKS cache -------------------------------------------------------------
// Both providers serve their signing keys with a long Cache-Control (~24h) and
// rotate slowly. Fetching them on every login put a round trip to Google on the
// hot path of the callback, and with no abort signal a stall there hung the
// login until Cloudflare's wall-clock cap rather than failing it (#162).
//
// Module scope, so the cache lives as long as the isolate — shared across
// requests it happens to serve, gone on eviction. That is the right lifetime
// here: it is a public document, and the worst case of a cold isolate is the
// fetch we were doing anyway.
const JWKS_TIMEOUT_MS = 5000;
const JWKS_FALLBACK_TTL_MS = 60 * 60 * 1000; // 1h if the response says nothing
const jwksCache = new Map(); // url -> { keys, expires }

function maxAgeFrom(res) {
  const cc = res.headers.get("cache-control") || "";
  const m = cc.match(/max-age=(\d+)/i);
  if (!m) return JWKS_FALLBACK_TTL_MS;
  // Clamp: a provider sending max-age=0 should not mean "never cache and hit
  // the network every login", and one sending a year should not outlive a key
  // rotation we would otherwise pick up.
  const secs = Math.min(Math.max(Number(m[1]), 300), 24 * 60 * 60);
  return secs * 1000;
}

async function fetchJwks(url, fetchImpl) {
  const res = await fetchImpl(url, { signal: AbortSignal.timeout(JWKS_TIMEOUT_MS) });
  if (!res.ok) return null;
  const body = await res.json();
  const keys = body && Array.isArray(body.keys) ? body.keys : null;
  if (!keys) return null;
  jwksCache.set(url, { keys, expires: Date.now() + maxAgeFrom(res) });
  return keys;
}

/**
 * The signing keys for `url`, cached.
 *
 * `wantKid` is what makes this safe across a key rotation: if the cached set
 * does not contain the kid the token was signed with, the cache is stale by
 * definition, so it refetches once rather than rejecting a token that is
 * actually valid. Without that, a rotation would fail every login until the
 * isolate happened to be evicted.
 */
async function getJwks(url, wantKid, fetchImpl) {
  const hit = jwksCache.get(url);
  const fresh = hit && hit.expires > Date.now();
  if (fresh && hit.keys.some((k) => k.kid === wantKid)) return hit.keys;

  try {
    const keys = await fetchJwks(url, fetchImpl);
    if (keys) return keys;
  } catch {
    // Timed out or the network failed. Fall through.
  }
  // A cached set that is merely expired still beats nothing — the alternative
  // is refusing every login while the provider is unreachable.
  return hit ? hit.keys : null;
}

export async function verifyIdToken(idToken, cfg, fetchImpl = fetch, expectedNonce = null) {
  const jwt = parseJwt(idToken);
  if (!jwt || jwt.header.alg !== "RS256" || !jwt.header.kid) return null;

  const keys = await getJwks(cfg.jwks, jwt.header.kid, fetchImpl);
  if (!keys) return null;

  const jwk = keys.find((k) => k.kid === jwt.header.kid);
  if (!jwk) return null;

  let ok = false;
  try {
    const key = await crypto.subtle.importKey(
      "jwk",
      { ...jwk, alg: "RS256", ext: true },
      { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
      false,
      ["verify"],
    );
    ok = await crypto.subtle.verify(
      "RSASSA-PKCS1-v1_5",
      key,
      bytesFromB64url(jwt.signature),
      new TextEncoder().encode(jwt.signed),
    );
  } catch {
    return null;
  }
  if (!ok) return null;

  const p = jwt.payload;
  const now = Math.floor(Date.now() / 1000);
  if (!p.sub) return null;
  if (p.exp && now > p.exp) return null;
  // 60s of slack for clock drift between us and the provider.
  if (p.nbf && now + 60 < p.nbf) return null;

  const aud = Array.isArray(p.aud) ? p.aud : [p.aud];
  if (!aud.includes(cfg.clientId)) return null;

  if (cfg.issuers && !cfg.issuers.includes(p.iss)) return null;
  if (!cfg.issuers && !isTrustedMicrosoftIssuer(String(p.iss), cfg.tenant)) return null;

  // The nonce ties this ID token to the browser that started the flow (#159).
  // code+PKCE over a server-side exchange already blocks replay; this closes
  // token substitution — an ID token that leaked into a log or through a
  // TLS-terminating proxy being injected here. Absent when expected is a
  // failure, not a pass: a provider that drops the nonce is one we cannot bind.
  if (expectedNonce && p.nonce !== expectedNonce) return null;

  return p;
}

const GUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Microsoft's issuer under `common` carries the *signing tenant's* id, which is
 * not known ahead of time — hence the shape check rather than a fixed string.
 *
 * Once a tenant is pinned, that shape check is too loose: a token minted by a
 * different Entra tenant, with a matching `client_id`, passes it (#160).
 *
 * The catch is that `MS_TENANT` may legitimately be a GUID, a verified domain
 * (`contoso.onmicrosoft.com`), or one of `common` / `organizations` /
 * `consumers` — while `iss` always carries the tenant **GUID**. So a domain
 * value cannot be matched against the issuer without a discovery round trip,
 * and pattern-matching it would reject every valid login. We therefore tighten
 * only when the pin is a GUID, which is the case where we can be certain, and
 * leave the rest on the host check.
 */
export function isTrustedMicrosoftIssuer(iss, tenant) {
  if (!/^https:\/\/login\.microsoftonline\.com\//.test(iss)) return false;
  if (!tenant || !GUID.test(tenant)) return true;
  return new RegExp(`^https://login\\.microsoftonline\\.com/${tenant}/`, "i").test(iss);
}

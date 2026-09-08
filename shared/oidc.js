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
export async function verifyIdToken(idToken, cfg, fetchImpl = fetch) {
  const jwt = parseJwt(idToken);
  if (!jwt || jwt.header.alg !== "RS256" || !jwt.header.kid) return null;

  let keys;
  try {
    const res = await fetchImpl(cfg.jwks);
    if (!res.ok) return null;
    keys = (await res.json()).keys;
  } catch {
    return null;
  }
  const jwk = (keys || []).find((k) => k.kid === jwt.header.kid);
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
  if (!cfg.issuers && !/^https:\/\/login\.microsoftonline\.com\//.test(String(p.iss))) return null;

  return p;
}

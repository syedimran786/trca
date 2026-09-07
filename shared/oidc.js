// OIDC helpers — PKCE, state cookie signing/verification, JWKS-based ID token
// verification. Used by functions/auth/[provider]/start.js + callback.js.
//
// No external dependencies — only Web Crypto API (available in CF Workers).

// ---------------------------------------------------------------------------
// Provider configuration
// ---------------------------------------------------------------------------
export const PROVIDER_CONFIG = {
  google: {
    authEndpoint: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenEndpoint: "https://oauth2.googleapis.com/token",
    jwksUri: "https://www.googleapis.com/oauth2/v3/certs",
    issuer: "https://accounts.google.com",
    scope: "openid email profile",
    clientIdEnv: "GOOGLE_CLIENT_ID",
    clientSecretEnv: "GOOGLE_CLIENT_SECRET",
  },
  microsoft: {
    authEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenEndpoint: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    jwksUri: "https://login.microsoftonline.com/common/discovery/v2.0/keys",
    // Microsoft's issuer includes the tenantId — varies per organisation.
    // Validate by prefix only (https://login.microsoftonline.com/{tenantId}/v2.0).
    issuerPrefix: "https://login.microsoftonline.com/",
    scope: "openid email profile",
    clientIdEnv: "MS_CLIENT_ID",
    clientSecretEnv: "MS_CLIENT_SECRET",
  },
};

// ---------------------------------------------------------------------------
// Base64url helpers (no dependency on Node.js Buffer)
// ---------------------------------------------------------------------------
export function base64urlEncode(buffer) {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function base64urlDecode(s) {
  const padded = s.replace(/-/g, "+").replace(/_/g, "/");
  const pad = padded.length % 4;
  const full = pad ? padded + "=".repeat(4 - pad) : padded;
  const binary = atob(full);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// ---------------------------------------------------------------------------
// PKCE — Authorization Code + PKCE (S256)
// ---------------------------------------------------------------------------
// code_verifier: 32 random bytes → base64url (43 chars, within 43-128 spec)
export function generateCodeVerifier() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

// code_challenge = base64url(SHA-256(ASCII(code_verifier)))
export async function generateCodeChallenge(verifier) {
  const encoded = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", encoded);
  return base64urlEncode(new Uint8Array(digest));
}

// Random state value (16 bytes → 22-char base64url)
export function generateState() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

// Random nonce value (16 bytes)
export function generateNonce() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return base64urlEncode(bytes);
}

// ---------------------------------------------------------------------------
// State cookie — HMAC-SHA256 signed, carries state + codeVerifier + nonce
// ---------------------------------------------------------------------------
// Cookie value: base64url(json).base64url(hmac)
// `exp` is a Unix ms timestamp; the cookie itself is Max-Age=600 but we also
// check exp in software so a replayed cookie after expiry is rejected.

async function hmacKey(secret) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function signStateCookie(payload, secret) {
  const data = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return `${data}.${base64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyStateCookie(cookie, secret) {
  if (!cookie) return null;
  const dot = cookie.lastIndexOf(".");
  if (dot < 0) return null;
  const data = cookie.slice(0, dot);
  const sig = cookie.slice(dot + 1);

  // Constant-time HMAC check
  const key = await hmacKey(secret);
  let sigBytes;
  try {
    sigBytes = base64urlDecode(sig);
  } catch {
    return null;
  }
  const valid = await crypto.subtle.verify(
    "HMAC",
    key,
    sigBytes,
    new TextEncoder().encode(data)
  );
  if (!valid) return null;

  // Decode payload
  let payload;
  try {
    const json = new TextDecoder().decode(base64urlDecode(data));
    payload = JSON.parse(json);
  } catch {
    return null;
  }

  // Software expiry check (belt-and-suspenders — cookie Max-Age also expires it)
  if (!payload.exp || Date.now() > payload.exp) return null;

  return payload;
}

// ---------------------------------------------------------------------------
// JWKS-based ID token verification
// ---------------------------------------------------------------------------
// Supports RS256 (RSA + SHA-256) and ES256 (ECDSA P-256 + SHA-256).
// Both Google and Microsoft use RS256 in practice.

function parseJwtParts(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[0])));
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(parts[1])));
    return {
      header,
      payload,
      signingInput: `${parts[0]}.${parts[1]}`,
      signature: parts[2],
    };
  } catch {
    return null;
  }
}

async function fetchJwks(uri) {
  // CF's fetch respects Cache-Control from the upstream JWKS endpoint
  // (Google: 1h, Microsoft: 24h). cacheTtl is a floor in case the upstream
  // header is shorter.
  const res = await fetch(uri, { cf: { cacheTtl: 3600, cacheEverything: false } });
  if (!res.ok) throw new Error(`JWKS fetch failed: ${res.status}`);
  const { keys } = await res.json();
  if (!Array.isArray(keys)) throw new Error("JWKS response missing keys array");
  return keys;
}

async function importRsaKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["verify"]
  );
}

async function importEcKey(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["verify"]
  );
}

async function verifyJwtSignature(alg, cryptoKey, signingInput, signature) {
  const sigBytes = base64urlDecode(signature);
  const inputBytes = new TextEncoder().encode(signingInput);
  if (alg === "RS256") {
    return crypto.subtle.verify("RSASSA-PKCS1-v1_5", cryptoKey, sigBytes, inputBytes);
  }
  if (alg === "ES256") {
    return crypto.subtle.verify(
      { name: "ECDSA", hash: "SHA-256" },
      cryptoKey,
      sigBytes,
      inputBytes
    );
  }
  return false;
}

// Verifies signature + standard claims (iss, aud, exp, iat, nonce).
// Returns the payload object on success. Throws a descriptive Error on failure.
// providerKey: 'google' | 'microsoft'
// expectedNonce: the nonce generated at start, stored in the state cookie
export async function verifyIdToken(idToken, providerKey, clientId, expectedNonce) {
  const parsed = parseJwtParts(idToken);
  if (!parsed) throw new Error("Malformed ID token");

  const { header, payload, signingInput, signature } = parsed;
  const alg = header.alg;
  if (!["RS256", "ES256"].includes(alg)) throw new Error(`Unsupported alg: ${alg}`);

  const config = PROVIDER_CONFIG[providerKey];
  if (!config) throw new Error(`Unknown provider: ${providerKey}`);

  // Fetch JWKS and find the key matching the token's kid
  const keys = await fetchJwks(config.jwksUri);
  let jwk;
  if (header.kid) {
    jwk = keys.find((k) => k.kid === header.kid);
  } else {
    // No kid in token header — only safe if exactly one signing key exists
    const sigKeys = keys.filter((k) => !k.use || k.use === "sig");
    if (sigKeys.length !== 1) {
      throw new Error(
        `Token has no kid; JWKS has ${sigKeys.length} signing keys — cannot select unambiguously`
      );
    }
    jwk = sigKeys[0];
  }
  if (!jwk) throw new Error(`No JWKS key matching kid=${header.kid}`);

  // Import key and verify signature
  const cryptoKey = alg === "RS256" ? await importRsaKey(jwk) : await importEcKey(jwk);
  const sigValid = await verifyJwtSignature(alg, cryptoKey, signingInput, signature);
  if (!sigValid) throw new Error("ID token signature invalid");

  // Standard claim checks
  const now = Math.floor(Date.now() / 1000);
  if (!payload.exp || payload.exp < now) throw new Error("ID token expired");
  if (payload.iat && payload.iat > now + 300) throw new Error("ID token iat too far in future");

  // aud can be a string or an array (Google sometimes sends an array)
  const audList = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audList.includes(clientId)) {
    throw new Error(`ID token aud mismatch (got: ${audList.join(",")})`);
  }

  // Issuer check — Google: exact match; Microsoft: prefix (includes tenantId)
  if (config.issuer && payload.iss !== config.issuer) {
    throw new Error(`ID token iss mismatch: expected ${config.issuer}, got ${payload.iss}`);
  }
  if (config.issuerPrefix) {
    const iss = String(payload.iss || "");
    // Must start with the prefix AND have additional content (the tenantId segment).
    // Bare prefix alone ("https://login.microsoftonline.com") is not a valid issuer.
    if (!iss.startsWith(config.issuerPrefix) || iss.length <= config.issuerPrefix.length) {
      throw new Error(`ID token iss invalid: ${payload.iss}`);
    }
  }

  // Nonce (replay protection) — only checked if we sent one
  if (expectedNonce && payload.nonce !== expectedNonce) {
    throw new Error("ID token nonce mismatch");
  }

  return payload;
}

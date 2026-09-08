// Signed-cookie sessions for the student portal. A compact HS256 JWT signed
// with the SESSION_SECRET Pages secret via Web Crypto (Workers runtime). The
// cookie is HttpOnly + Secure + SameSite=Lax. No third-party auth service —
// the portal owns its sessions, on the Cloudflare stack.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64url(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlToBytes(str) {
  let s = str.replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}
function hmacKey(secret) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

const DEFAULT_TTL = 60 * 60 * 24 * 30; // 30 days

// Sign a session. `payload` carries { uid, email, name, role, ... }.
export async function signSession(payload, secret, ttlSeconds = DEFAULT_TTL) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(enc.encode(JSON.stringify({ alg: "HS256", typ: "JWT" })));
  const body = b64url(enc.encode(JSON.stringify({ ...payload, iat: now, exp: now + ttlSeconds })));
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${header}.${body}`));
  return `${header}.${body}.${b64url(sig)}`;
}

// Verify + decode a session. Returns the payload, or null if invalid/expired.
export async function verifySession(token, secret) {
  if (!token || typeof token !== "string" || !secret) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, body, sig] = parts;
  const key = await hmacKey(secret);
  let ok = false;
  try {
    ok = await crypto.subtle.verify("HMAC", key, b64urlToBytes(sig), enc.encode(`${header}.${body}`));
  } catch {
    return null;
  }
  if (!ok) return null;
  let payload;
  try {
    payload = JSON.parse(dec.decode(b64urlToBytes(body)));
  } catch {
    return null;
  }
  if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) return null;
  return payload;
}

export function sessionCookie(token, maxAge = DEFAULT_TTL) {
  return `rca_session=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}
export function clearSessionCookie() {
  return `rca_session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0`;
}
export function readCookie(request, name = "rca_session") {
  const raw = request.headers.get("cookie") || "";
  const m = raw.match(new RegExp(`(?:^|;\\s*)${name}=([^;]+)`));
  return m ? m[1] : null;
}

// Convenience for portal API routes: returns the session payload or null.
export async function getSession(request, env) {
  return verifySession(readCookie(request), env && env.SESSION_SECRET);
}

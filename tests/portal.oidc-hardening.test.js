import { describe, it, expect, beforeAll } from "vitest";
import { onRequestGet as startGet } from "../functions/auth/[provider]/start.js";
import { signSession, verifySession } from "../shared/auth.js";
import { providerConfig, verifyIdToken, isTrustedMicrosoftIssuer } from "../shared/oidc.js";

const SECRET = "test-secret-value";
const CONFIGURED = {
  SESSION_SECRET: SECRET,
  GOOGLE_CLIENT_ID: "g-id",
  GOOGLE_CLIENT_SECRET: "g-secret",
  MS_CLIENT_ID: "m-id",
  MS_CLIENT_SECRET: "m-secret",
};
const req = (url, headers = {}) => new Request(url, { headers });
const setCookies = (res) =>
  (typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")]
  ).filter(Boolean);

// --- a real RS256 signer, so the ID-token tests exercise the actual path ----
const enc = new TextEncoder();
const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64urlJson = (o) => b64url(enc.encode(JSON.stringify(o)));

let KEY, JWK;
const KID = "test-key-1";

beforeAll(async () => {
  KEY = await crypto.subtle.generateKey(
    { name: "RSASSA-PKCS1-v1_5", modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" },
    true,
    ["sign", "verify"],
  );
  JWK = { ...(await crypto.subtle.exportKey("jwk", KEY.publicKey)), kid: KID, alg: "RS256" };
  delete JWK.key_ops;
  delete JWK.ext;
});

async function idToken(payload, { kid = KID } = {}) {
  const head = b64urlJson({ alg: "RS256", typ: "JWT", kid });
  const body = b64urlJson(payload);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", KEY.privateKey, enc.encode(`${head}.${body}`));
  return `${head}.${body}.${b64url(sig)}`;
}

const googleCfg = () => providerConfig("google", CONFIGURED);
const claims = (over = {}) => ({
  sub: "user-1",
  aud: "g-id",
  iss: "https://accounts.google.com",
  exp: Math.floor(Date.now() / 1000) + 600,
  ...over,
});

// A fetch stub that counts calls, so caching is observable.
function jwksStub(keys = [JWK], { cacheControl = "max-age=86400", ok = true } = {}) {
  const fn = async () => {
    fn.calls++;
    return new Response(JSON.stringify({ keys }), {
      status: ok ? 200 : 500,
      headers: { "content-type": "application/json", "cache-control": cacheControl },
    });
  };
  fn.calls = 0;
  return fn;
}

describe("#161 — the session helper pins its algorithm", () => {
  // Swapping the header while keeping the original signature proves nothing:
  // the HMAC covers the header, so the signature check rejects it whether or
  // not the alg is inspected. To isolate the new check the token has to be
  // *validly* signed over the swapped header — which is exactly what an
  // attacker holds in a real alg-confusion, where the "secret" is a public key
  // they already know.
  async function hs256(headerObj, payload) {
    const head = b64urlJson(headerObj);
    const body = b64urlJson({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 });
    const key = await crypto.subtle.importKey(
      "raw", enc.encode(SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
    );
    const sig = await crypto.subtle.sign("HMAC", key, enc.encode(`${head}.${body}`));
    return `${head}.${body}.${b64url(sig)}`;
  }

  it("still accepts a session it signed itself", async () => {
    const t = await signSession({ uid: 1 }, SECRET);
    expect(await verifySession(t, SECRET)).toMatchObject({ uid: 1 });
  });

  it("accepts a correctly-signed HS256 token built by hand — the control", async () => {
    // Establishes that the helper produces something the verifier would
    // otherwise accept, so the next two fail on the alg and nothing else.
    expect(await verifySession(await hs256({ alg: "HS256", typ: "JWT" }, { uid: 1 }), SECRET))
      .toMatchObject({ uid: 1 });
  });

  it("rejects a validly-signed token that claims RS256", async () => {
    expect(await verifySession(await hs256({ alg: "RS256", typ: "JWT" }, { uid: 1 }), SECRET)).toBeNull();
  });

  it("rejects a validly-signed token that claims alg: none", async () => {
    expect(await verifySession(await hs256({ alg: "none", typ: "JWT" }, { uid: 1 }), SECRET)).toBeNull();
  });

  it("rejects a header that is not JSON at all", async () => {
    const t = await signSession({ uid: 1 }, SECRET);
    const [, body, sig] = t.split(".");
    expect(await verifySession(`bm90LWpzb24.${body}.${sig}`, SECRET)).toBeNull();
  });
});

describe("#160 — the Microsoft issuer is held to the pinned tenant", () => {
  const GUID = "11111111-2222-3333-4444-555555555555";
  const OTHER = "99999999-2222-3333-4444-555555555555";
  const iss = (t) => `https://login.microsoftonline.com/${t}/v2.0`;

  it("accepts any tenant when none is pinned", () => {
    expect(isTrustedMicrosoftIssuer(iss(GUID), null)).toBe(true);
    expect(isTrustedMicrosoftIssuer(iss(GUID), "common")).toBe(true);
  });

  it("accepts the pinned tenant", () => {
    expect(isTrustedMicrosoftIssuer(iss(GUID), GUID)).toBe(true);
  });

  it("rejects a different tenant once one is pinned — the actual bug", () => {
    expect(isTrustedMicrosoftIssuer(iss(OTHER), GUID)).toBe(false);
  });

  it("never accepts a host that is not Microsoft's", () => {
    expect(isTrustedMicrosoftIssuer(`https://evil.example/${GUID}/v2.0`, GUID)).toBe(false);
    expect(isTrustedMicrosoftIssuer(`https://evil.example/${GUID}/v2.0`, null)).toBe(false);
  });

  it("does not lock out a domain-shaped pin, whose GUID we cannot know", () => {
    // `iss` always carries the tenant GUID, so matching a domain against it
    // would reject every valid login. Documented behaviour, not an oversight.
    expect(isTrustedMicrosoftIssuer(iss(GUID), "contoso.onmicrosoft.com")).toBe(true);
  });

  it("carries the tenant onto the provider config", () => {
    expect(providerConfig("microsoft", { ...CONFIGURED, MS_TENANT: "abc" }).tenant).toBe("abc");
  });
});

describe("#162 — JWKS is fetched with a timeout and cached", () => {
  it("passes an abort signal, so a stalled provider fails instead of hanging", async () => {
    let seen = null;
    const spy = async (url, init) => {
      seen = init;
      return new Response(JSON.stringify({ keys: [JWK] }), {
        headers: { "content-type": "application/json" },
      });
    };
    await verifyIdToken(await idToken(claims()), googleCfg(), spy);
    expect(seen && seen.signal).toBeInstanceOf(AbortSignal);
  });

  it("serves a second verification from cache", async () => {
    const cfg = { ...googleCfg(), jwks: "https://example.test/jwks-cache" };
    const f = jwksStub();
    expect(await verifyIdToken(await idToken(claims()), cfg, f)).toMatchObject({ sub: "user-1" });
    expect(await verifyIdToken(await idToken(claims()), cfg, f)).toMatchObject({ sub: "user-1" });
    expect(f.calls).toBe(1);
  });

  it("refetches when the token's kid is not in the cached set — key rotation", async () => {
    const cfg = { ...googleCfg(), jwks: "https://example.test/jwks-rotate" };
    const stale = jwksStub([{ ...JWK, kid: "old-key" }]);
    await verifyIdToken(await idToken(claims(), { kid: "old-key" }), cfg, stale);
    expect(stale.calls).toBe(1);

    // Same URL, but now signed with a kid the cache has never seen.
    const rotated = jwksStub([JWK]);
    expect(await verifyIdToken(await idToken(claims()), cfg, rotated)).toMatchObject({ sub: "user-1" });
    expect(rotated.calls).toBe(1);
  });

  it("falls back to an expired cache rather than refusing every login", async () => {
    const cfg = { ...googleCfg(), jwks: "https://example.test/jwks-stale" };
    await verifyIdToken(await idToken(claims()), cfg, jwksStub([JWK], { cacheControl: "max-age=0" }));

    const dead = async () => {
      throw new Error("network down");
    };
    expect(await verifyIdToken(await idToken(claims()), cfg, dead)).toMatchObject({ sub: "user-1" });
  });

  it("returns null when there is no cache and the fetch fails", async () => {
    const cfg = { ...googleCfg(), jwks: "https://example.test/jwks-never" };
    const dead = async () => {
      throw new Error("network down");
    };
    expect(await verifyIdToken(await idToken(claims()), cfg, dead)).toBeNull();
  });
});

describe("#159 — the OIDC flow carries a nonce", () => {
  it("sends a nonce to the provider and remembers it in an HttpOnly cookie", async () => {
    const res = await startGet({
      request: req("https://restcoderacademy.in/auth/google/start"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    const sent = new URL(res.headers.get("location")).searchParams.get("nonce");
    expect(sent).toBeTruthy();

    const jar = setCookies(res).find((c) => c.startsWith("rca_oauth_nonce="));
    expect(jar).toContain("HttpOnly");
    expect(jar).toContain("SameSite=Lax");
    expect(jar.split(";")[0].split("=")[1]).toBe(sent);
  });

  it("accepts an ID token carrying the expected nonce", async () => {
    const t = await idToken(claims({ nonce: "n-123" }));
    expect(await verifyIdToken(t, googleCfg(), jwksStub(), "n-123")).toMatchObject({ sub: "user-1" });
  });

  it("rejects a token minted for a different flow", async () => {
    const t = await idToken(claims({ nonce: "someone-elses" }));
    expect(await verifyIdToken(t, googleCfg(), jwksStub(), "n-123")).toBeNull();
  });

  it("rejects a token with no nonce when one was expected", async () => {
    const t = await idToken(claims());
    expect(await verifyIdToken(t, googleCfg(), jwksStub(), "n-123")).toBeNull();
  });

  it("still verifies when no nonce is expected, so nothing else breaks", async () => {
    const t = await idToken(claims());
    expect(await verifyIdToken(t, googleCfg(), jwksStub())).toMatchObject({ sub: "user-1" });
  });
});

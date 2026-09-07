// Tests for shared/oidc.js — PKCE helpers + state cookie signing.
// ID token verification tests are omitted: they require live JWKS + a real
// signed token, which belongs in a separate integration test with provider
// test credentials.
import { describe, it, expect } from "vitest";
import {
  base64urlEncode,
  base64urlDecode,
  generateCodeVerifier,
  generateCodeChallenge,
  generateState,
  generateNonce,
  signStateCookie,
  verifyStateCookie,
} from "./oidc.js";

describe("base64url helpers", () => {
  it("round-trips arbitrary bytes", () => {
    const input = new Uint8Array([0, 1, 127, 128, 255]);
    expect(base64urlDecode(base64urlEncode(input))).toEqual(input);
  });

  it("produces no + / = characters", () => {
    for (let i = 0; i < 50; i++) {
      const bytes = new Uint8Array(32);
      crypto.getRandomValues(bytes);
      const encoded = base64urlEncode(bytes);
      expect(encoded).not.toMatch(/[+/=]/);
    }
  });
});

describe("generateCodeVerifier", () => {
  it("returns a 43-char base64url string (32 bytes → 43 chars)", () => {
    const v = generateCodeVerifier();
    expect(typeof v).toBe("string");
    expect(v.length).toBe(43);
    expect(v).not.toMatch(/[+/=]/);
  });

  it("returns different values on successive calls", () => {
    expect(generateCodeVerifier()).not.toBe(generateCodeVerifier());
  });
});

describe("generateCodeChallenge", () => {
  it("returns a non-empty base64url string", async () => {
    const verifier = generateCodeVerifier();
    const challenge = await generateCodeChallenge(verifier);
    expect(typeof challenge).toBe("string");
    expect(challenge.length).toBeGreaterThan(0);
    expect(challenge).not.toMatch(/[+/=]/);
  });

  it("is deterministic for the same verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const c1 = await generateCodeChallenge(verifier);
    const c2 = await generateCodeChallenge(verifier);
    expect(c1).toBe(c2);
  });

  // RFC 7636 Appendix B test vector
  it("matches RFC 7636 test vector", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    expect(await generateCodeChallenge(verifier)).toBe(expected);
  });
});

describe("generateState / generateNonce", () => {
  it("returns non-empty strings with no padding chars", () => {
    const s = generateState();
    const n = generateNonce();
    expect(s).not.toMatch(/[+/=]/);
    expect(n).not.toMatch(/[+/=]/);
  });

  it("successive calls differ", () => {
    expect(generateState()).not.toBe(generateState());
    expect(generateNonce()).not.toBe(generateNonce());
  });
});

describe("state cookie sign / verify", () => {
  const SECRET = "test-cookie-secret-32-chars-min!!";

  it("round-trips a valid payload", async () => {
    const payload = {
      state: generateState(),
      codeVerifier: generateCodeVerifier(),
      nonce: generateNonce(),
      provider: "google",
      redirectUri: "https://example.com/auth/google/callback",
      exp: Date.now() + 60_000,
    };
    const cookie = await signStateCookie(payload, SECRET);
    const decoded = await verifyStateCookie(cookie, SECRET);
    expect(decoded).not.toBeNull();
    expect(decoded.state).toBe(payload.state);
    expect(decoded.codeVerifier).toBe(payload.codeVerifier);
    expect(decoded.nonce).toBe(payload.nonce);
    expect(decoded.provider).toBe("google");
  });

  it("rejects an expired payload", async () => {
    const payload = { state: "x", exp: Date.now() - 1000 };
    const cookie = await signStateCookie(payload, SECRET);
    expect(await verifyStateCookie(cookie, SECRET)).toBeNull();
  });

  it("rejects a tampered payload", async () => {
    const payload = { state: "x", exp: Date.now() + 60_000 };
    const cookie = await signStateCookie(payload, SECRET);
    const tampered = cookie.slice(0, -4) + "AAAA";
    expect(await verifyStateCookie(tampered, SECRET)).toBeNull();
  });

  it("rejects a cookie signed with a different secret", async () => {
    const payload = { state: "x", exp: Date.now() + 60_000 };
    const cookie = await signStateCookie(payload, SECRET);
    expect(await verifyStateCookie(cookie, "different-secret")).toBeNull();
  });

  it("returns null for null/empty input", async () => {
    expect(await verifyStateCookie(null, SECRET)).toBeNull();
    expect(await verifyStateCookie("", SECRET)).toBeNull();
    expect(await verifyStateCookie("notadotseperatedvalue", SECRET)).toBeNull();
  });
});

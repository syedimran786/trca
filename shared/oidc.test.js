// Tests for shared/oidc.js — PKCE helpers, provider config, ID token verification.
import { describe, it, expect, vi } from "vitest";
import {
  PROVIDERS,
  providerConfig,
  isConfigured,
  configuredProviders,
  randomString,
  codeChallenge,
  redirectUri,
  verifyIdToken,
} from "./oidc.js";

// ---------------------------------------------------------------------------
// randomString
// ---------------------------------------------------------------------------
describe("randomString", () => {
  it("returns a base64url string with no + / = chars", () => {
    const s = randomString();
    expect(typeof s).toBe("string");
    expect(s.length).toBeGreaterThan(0);
    expect(s).not.toMatch(/[+/=]/);
  });

  it("respects the byte-length parameter", () => {
    // 16 bytes → 22 base64url chars (ceil(16*4/3) without padding)
    expect(randomString(16).length).toBe(22);
    // 32 bytes → 43 chars
    expect(randomString(32).length).toBe(43);
  });

  it("returns different values on successive calls", () => {
    expect(randomString()).not.toBe(randomString());
  });
});

// ---------------------------------------------------------------------------
// codeChallenge
// ---------------------------------------------------------------------------
describe("codeChallenge", () => {
  it("returns a non-empty base64url string", async () => {
    const challenge = await codeChallenge(randomString(32));
    expect(typeof challenge).toBe("string");
    expect(challenge.length).toBeGreaterThan(0);
    expect(challenge).not.toMatch(/[+/=]/);
  });

  it("is deterministic for the same verifier", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    expect(await codeChallenge(verifier)).toBe(await codeChallenge(verifier));
  });

  // RFC 7636 Appendix B test vector
  it("matches RFC 7636 test vector", async () => {
    const verifier = "dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk";
    const expected = "E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM";
    expect(await codeChallenge(verifier)).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// redirectUri
// ---------------------------------------------------------------------------
describe("redirectUri", () => {
  it("builds origin + /auth/:provider/callback", () => {
    const req = new Request("https://example.com/some/path");
    expect(redirectUri(req, "google")).toBe(
      "https://example.com/auth/google/callback"
    );
    expect(redirectUri(req, "microsoft")).toBe(
      "https://example.com/auth/microsoft/callback"
    );
  });
});

// ---------------------------------------------------------------------------
// providerConfig
// ---------------------------------------------------------------------------
describe("providerConfig", () => {
  const env = {
    GOOGLE_CLIENT_ID: "gid",
    GOOGLE_CLIENT_SECRET: "gsecret",
    MS_CLIENT_ID: "msid",
    MS_CLIENT_SECRET: "mssecret",
    SESSION_SECRET: "sess",
  };

  it("returns null for unknown provider", () => {
    expect(providerConfig("unknown", env)).toBeNull();
  });

  it("returns google config with correct endpoints", () => {
    const cfg = providerConfig("google", env);
    expect(cfg).not.toBeNull();
    expect(cfg.name).toBe("google");
    expect(cfg.authorize).toContain("accounts.google.com");
    expect(cfg.token).toContain("googleapis.com");
    expect(cfg.jwks).toContain("googleapis.com");
    expect(cfg.clientId).toBe("gid");
    expect(cfg.clientSecret).toBe("gsecret");
  });

  it("returns microsoft config with common tenant by default", () => {
    const cfg = providerConfig("microsoft", env);
    expect(cfg.authorize).toContain("common");
    expect(cfg.token).toContain("common");
    expect(cfg.jwks).toContain("common");
    expect(cfg.clientId).toBe("msid");
  });

  it("uses MS_TENANT when set", () => {
    const cfg = providerConfig("microsoft", { ...env, MS_TENANT: "mytenant" });
    expect(cfg.authorize).toContain("mytenant");
  });
});

// ---------------------------------------------------------------------------
// isConfigured / configuredProviders
// ---------------------------------------------------------------------------
describe("isConfigured", () => {
  it("returns false when client id missing", () => {
    expect(isConfigured("google", { SESSION_SECRET: "s" })).toBe(false);
  });

  it("returns false when client secret missing", () => {
    expect(
      isConfigured("google", { GOOGLE_CLIENT_ID: "id", SESSION_SECRET: "s" })
    ).toBe(false);
  });

  it("returns false when SESSION_SECRET missing", () => {
    expect(
      isConfigured("google", {
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "sec",
      })
    ).toBe(false);
  });

  it("returns true when all secrets present", () => {
    expect(
      isConfigured("google", {
        GOOGLE_CLIENT_ID: "id",
        GOOGLE_CLIENT_SECRET: "sec",
        SESSION_SECRET: "sess",
      })
    ).toBe(true);
  });

  it("returns false for unknown provider regardless of env", () => {
    expect(isConfigured("unknown", { SESSION_SECRET: "s" })).toBe(false);
  });
});

describe("configuredProviders", () => {
  it("returns empty array when nothing configured", () => {
    expect(configuredProviders({})).toEqual([]);
  });

  it("returns only configured providers", () => {
    const env = {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      SESSION_SECRET: "sess",
    };
    const result = configuredProviders(env);
    expect(result).toContain("google");
    expect(result).not.toContain("microsoft");
  });

  it("returns all known providers when all configured", () => {
    const env = {
      GOOGLE_CLIENT_ID: "gid",
      GOOGLE_CLIENT_SECRET: "gsec",
      MS_CLIENT_ID: "msid",
      MS_CLIENT_SECRET: "mssec",
      SESSION_SECRET: "sess",
    };
    const result = configuredProviders(env);
    expect(result).toContain("google");
    expect(result).toContain("microsoft");
    expect(result.length).toBe(Object.keys(PROVIDERS).length);
  });
});

// ---------------------------------------------------------------------------
// verifyIdToken — fail-closed paths (no live JWKS needed)
// ---------------------------------------------------------------------------
describe("verifyIdToken", () => {
  const cfg = {
    jwks: "https://example.com/.well-known/jwks.json",
    clientId: "test-client",
    issuers: ["https://accounts.google.com"],
  };

  it("returns null for null/empty token", async () => {
    const fetchImpl = vi.fn();
    expect(await verifyIdToken(null, cfg, fetchImpl)).toBeNull();
    expect(await verifyIdToken("", cfg, fetchImpl)).toBeNull();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("returns null for malformed token (not 3 parts)", async () => {
    const fetchImpl = vi.fn();
    expect(await verifyIdToken("only.two", cfg, fetchImpl)).toBeNull();
    expect(await verifyIdToken("one", cfg, fetchImpl)).toBeNull();
  });

  it("returns null when JWKS fetch fails", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    // Build a minimal header with alg=RS256 + kid
    const header = btoa(JSON.stringify({ alg: "RS256", kid: "k1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa(JSON.stringify({ sub: "u1", exp: 9999999999 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const token = `${header}.${payload}.fakesig`;
    expect(await verifyIdToken(token, cfg, fetchImpl)).toBeNull();
  });

  it("returns null when JWKS fetch throws", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new Error("network"));
    const header = btoa(JSON.stringify({ alg: "RS256", kid: "k1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa(JSON.stringify({ sub: "u1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyIdToken(`${header}.${payload}.sig`, cfg, fetchImpl)).toBeNull();
  });

  it("returns null when kid not found in JWKS", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ keys: [{ kid: "other-kid", kty: "RSA" }] }),
    });
    const header = btoa(JSON.stringify({ alg: "RS256", kid: "k1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    const payload = btoa(JSON.stringify({ sub: "u1" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifyIdToken(`${header}.${payload}.sig`, cfg, fetchImpl)).toBeNull();
  });
});

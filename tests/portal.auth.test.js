import { describe, it, expect } from "vitest";
import { onRequestGet as startGet } from "../functions/auth/[provider]/start.js";
import { onRequestGet as meGet } from "../functions/auth/me.js";
import { onRequestPost as logoutPost } from "../functions/auth/logout.js";
import { signSession } from "../shared/auth.js";
import { configuredProviders, isConfigured, redirectUri, codeChallenge, randomString } from "../shared/oidc.js";

const SECRET = "test-secret-value";
const CONFIGURED = {
  SESSION_SECRET: SECRET,
  GOOGLE_CLIENT_ID: "g-id",
  GOOGLE_CLIENT_SECRET: "g-secret",
  MS_CLIENT_ID: "m-id",
  MS_CLIENT_SECRET: "m-secret",
};

const req = (url, headers = {}) => new Request(url, { headers });
const cookieHeader = (token) => ({ cookie: `rca_session=${token}` });
const setCookies = (res) =>
  (typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")]
  ).filter(Boolean);

describe("provider configuration", () => {
  it("reports nothing configured when the secrets are absent", () => {
    expect(configuredProviders({})).toEqual([]);
    expect(isConfigured("google", {})).toBe(false);
  });

  it("still reports nothing without a SESSION_SECRET to sign with", () => {
    expect(configuredProviders({ GOOGLE_CLIENT_ID: "a", GOOGLE_CLIENT_SECRET: "b" })).toEqual([]);
  });

  it("lists both providers once every secret is present", () => {
    expect(configuredProviders(CONFIGURED).sort()).toEqual(["google", "microsoft"]);
  });

  it("never treats an unknown provider as configured", () => {
    expect(isConfigured("facebook", CONFIGURED)).toBe(false);
  });
});

describe("GET /auth/:provider/start", () => {
  it("is inert until configured — 503, not a redirect to a provider error", async () => {
    const res = await startGet({ request: req("https://x.test/auth/google/start"), env: {}, params: { provider: "google" } });
    expect(res.status).toBe(503);
    expect((await res.json()).error).toBe("not_configured");
  });

  it("redirects to the provider with PKCE and a state", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    expect(res.status).toBe(302);
    const url = new URL(res.headers.get("location"));
    expect(url.origin + url.pathname).toBe("https://accounts.google.com/o/oauth2/v2/auth");
    expect(url.searchParams.get("client_id")).toBe("g-id");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("code_challenge")).toBeTruthy();
    expect(url.searchParams.get("state")).toBeTruthy();
    expect(url.searchParams.get("redirect_uri")).toBe("https://x.test/auth/google/callback");
  });

  it("stores the state and verifier in HttpOnly cookies", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    const cookies = setCookies(res).join("\n");
    expect(cookies).toMatch(/rca_oauth_state=/);
    expect(cookies).toMatch(/rca_oauth_verifier=/);
    expect(cookies).toMatch(/HttpOnly/);
    expect(cookies).toMatch(/Secure/);
  });

  it("refuses to carry an off-site `next` through the login round trip", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start?next=https://evil.test/steal"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    const next = setCookies(res).find((c) => c.startsWith("rca_oauth_next="));
    expect(decodeURIComponent(next.split(";")[0].split("=")[1])).toBe("/portal");
  });

  it("refuses a protocol-relative `next` too", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start?next=//evil.test"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    const next = setCookies(res).find((c) => c.startsWith("rca_oauth_next="));
    expect(decodeURIComponent(next.split(";")[0].split("=")[1])).toBe("/portal");
  });

  it("keeps a same-site `next`", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start?next=%2Fportal%2Fcourses"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    const next = setCookies(res).find((c) => c.startsWith("rca_oauth_next="));
    expect(decodeURIComponent(next.split(";")[0].split("=")[1])).toBe("/portal/courses");
  });

  it("points Microsoft at the tenant when one is set", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/microsoft/start"),
      env: { ...CONFIGURED, MS_TENANT: "contoso" },
      params: { provider: "microsoft" },
    });
    expect(res.headers.get("location")).toContain("/contoso/oauth2/v2.0/authorize");
  });
});

describe("GET /auth/me", () => {
  it("401s with no session, and says which providers can be offered", async () => {
    const res = await meGet({ request: req("https://x.test/auth/me"), env: CONFIGURED });
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.authenticated).toBe(false);
    expect(body.providers.sort()).toEqual(["google", "microsoft"]);
  });

  it("reports an empty provider list when nothing is configured", async () => {
    const res = await meGet({ request: req("https://x.test/auth/me"), env: {} });
    expect((await res.json()).providers).toEqual([]);
  });

  it("returns the user for a valid session", async () => {
    const token = await signSession({ uid: 7, email: "s@x.test", name: "Asha R", role: "student" }, SECRET);
    const res = await meGet({ request: req("https://x.test/auth/me", cookieHeader(token)), env: CONFIGURED });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user).toMatchObject({ id: 7, email: "s@x.test", name: "Asha R", role: "student" });
  });

  it("rejects a session signed with a different secret", async () => {
    const token = await signSession({ uid: 7 }, "some-other-secret");
    const res = await meGet({ request: req("https://x.test/auth/me", cookieHeader(token)), env: CONFIGURED });
    expect(res.status).toBe(401);
  });

  it("rejects a tampered payload", async () => {
    const token = await signSession({ uid: 7, role: "student" }, SECRET);
    const [h, , s] = token.split(".");
    const forged = btoa(JSON.stringify({ uid: 1, role: "admin", exp: 9999999999 }))
      .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const res = await meGet({
      request: req("https://x.test/auth/me", cookieHeader(`${h}.${forged}.${s}`)),
      env: CONFIGURED,
    });
    expect(res.status).toBe(401);
  });

  it("rejects an expired session", async () => {
    const token = await signSession({ uid: 7 }, SECRET, -10);
    const res = await meGet({ request: req("https://x.test/auth/me", cookieHeader(token)), env: CONFIGURED });
    expect(res.status).toBe(401);
  });

  it("is never cached — it carries who you are", async () => {
    const res = await meGet({ request: req("https://x.test/auth/me"), env: CONFIGURED });
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});

describe("POST /auth/logout", () => {
  it("clears the session cookie", async () => {
    const res = await logoutPost();
    expect(res.status).toBe(200);
    const cookie = res.headers.get("set-cookie");
    expect(cookie).toMatch(/rca_session=;/);
    expect(cookie).toMatch(/Max-Age=0/);
    expect(cookie).toMatch(/HttpOnly/);
  });
});

describe("PKCE helpers", () => {
  it("produces a URL-safe challenge of the right shape", async () => {
    const c = await codeChallenge("verifier-value");
    expect(c).toMatch(/^[A-Za-z0-9_-]{43}$/);
  });

  it("derives the challenge from the verifier, deterministically", async () => {
    expect(await codeChallenge("a")).toBe(await codeChallenge("a"));
    expect(await codeChallenge("a")).not.toBe(await codeChallenge("b"));
  });

  it("does not repeat a random string", () => {
    const seen = new Set(Array.from({ length: 50 }, () => randomString(16)));
    expect(seen.size).toBe(50);
  });

  it("builds the redirect URI from the request origin", () => {
    expect(redirectUri(req("https://restcoderacademy.in/auth/google/start"), "google"))
      .toBe("https://restcoderacademy.in/auth/google/callback");
  });
});

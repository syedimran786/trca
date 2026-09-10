// #163 — carrying a session from the system browser into the app's WebView.
import { describe, it, expect, beforeAll } from "vitest";
import { onRequestGet as startGet } from "../functions/auth/[provider]/start.js";
import { onRequestPost as exchangePost, onRequestOptions as exchangeOptions } from "../functions/auth/native/exchange.js";
import { onRequestPost as logoutPost } from "../functions/auth/logout.js";
import { signSession } from "../shared/auth.js";
import {
  HANDOFF_TTL_SECONDS,
  mintHandoffCode,
  redeemHandoffCode,
  sha256b64url,
} from "../shared/nativeHandoff.js";
import { isAllowedNativeOrigin, nativeCorsHeaders } from "../shared/nativeCors.js";

const SECRET = "test-secret-value";
const CONFIGURED = {
  SESSION_SECRET: SECRET,
  GOOGLE_CLIENT_ID: "g-id",
  GOOGLE_CLIENT_SECRET: "g-secret",
  MS_CLIENT_ID: "m-id",
  MS_CLIENT_SECRET: "m-secret",
};
const NATIVE_ORIGIN = "https://localhost";

const req = (url, headers = {}) => new Request(url, { headers });
const setCookies = (res) =>
  (typeof res.headers.getSetCookie === "function"
    ? res.headers.getSetCookie()
    : [res.headers.get("set-cookie")]
  ).filter(Boolean);
const cookieNamed = (res, name) =>
  setCookies(res).find((c) => c.startsWith(`${name}=`)) || null;
const cookieValue = (res, name) => {
  const c = cookieNamed(res, name);
  return c ? c.slice(name.length + 1).split(";")[0] : null;
};

/**
 * A D1 stand-in that actually stores rows.
 *
 * The single-use guarantee is the thing under test, and it lives in the row
 * count a DELETE reports — which a canned-response fake cannot express. So this
 * keeps a Map and reports `meta.changes` honestly.
 */
function fakeD1() {
  const rows = new Map();
  const db = {
    rows,
    prepare(sql) {
      const stmt = {
        args: [],
        bind(...args) {
          stmt.args = args;
          return stmt;
        },
        async run() {
          if (sql.startsWith("DELETE FROM native_handoff WHERE expires_at")) {
            const cutoff = stmt.args[0];
            let n = 0;
            for (const [k, v] of rows) if (v.expires_at <= cutoff) (rows.delete(k), n++);
            return { meta: { changes: n } };
          }
          if (sql.startsWith("DELETE FROM native_handoff WHERE code_hash")) {
            return { meta: { changes: rows.delete(stmt.args[0]) ? 1 : 0 } };
          }
          if (sql.startsWith("INSERT INTO native_handoff")) {
            const [code_hash, challenge, session, expires_at, created_at] = stmt.args;
            rows.set(code_hash, { code_hash, challenge, session, expires_at, created_at });
            return { meta: { changes: 1 } };
          }
          throw new Error(`unexpected run(): ${sql}`);
        },
        async first() {
          if (sql.startsWith("SELECT challenge, session, expires_at FROM native_handoff")) {
            return rows.get(stmt.args[0]) || null;
          }
          throw new Error(`unexpected first(): ${sql}`);
        },
      };
      return stmt;
    },
  };
  return db;
}

const VERIFIER = "a-verifier-the-app-kept-to-itself";
const challengeFor = (v) => sha256b64url(v);

describe("#163 — minting a hand-off code", () => {
  it("never stores the code itself, only its digest", async () => {
    const db = fakeD1();
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER));

    expect(db.rows.has(code)).toBe(false);
    expect(db.rows.has(await sha256b64url(code))).toBe(true);
  });

  it("gives every mint a distinct code", async () => {
    const db = fakeD1();
    const hc = await challengeFor(VERIFIER);
    const a = await mintHandoffCode(db, "s", hc);
    const b = await mintHandoffCode(db, "s", hc);
    expect(a).not.toBe(b);
  });

  it("sweeps codes that already expired, so abandoned sign-ins do not pile up", async () => {
    const db = fakeD1();
    const now = 1_000_000;
    await mintHandoffCode(db, "old", await challengeFor(VERIFIER), now);
    expect(db.rows.size).toBe(1);

    // A later mint, past the first one's TTL.
    await mintHandoffCode(db, "new", await challengeFor(VERIFIER), now + HANDOFF_TTL_SECONDS + 1);
    expect(db.rows.size).toBe(1);
    expect([...db.rows.values()][0].session).toBe("new");
  });
});

describe("#163 — redeeming a hand-off code", () => {
  it("returns the session for the right code and verifier", async () => {
    const db = fakeD1();
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER));
    expect(await redeemHandoffCode(db, code, VERIFIER)).toBe("session-jwt");
  });

  it("is single-use — the second redemption gets nothing", async () => {
    const db = fakeD1();
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER));

    expect(await redeemHandoffCode(db, code, VERIFIER)).toBe("session-jwt");
    expect(await redeemHandoffCode(db, code, VERIFIER)).toBeNull();
    expect(db.rows.size).toBe(0);
  });

  it("refuses a code presented without the verifier — the interception case", async () => {
    // This is the whole reason the code alone is safe to put in a URL that any
    // app registering rca:// can read.
    const db = fakeD1();
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER));

    expect(await redeemHandoffCode(db, code, "not-the-verifier")).toBeNull();
  });

  it("burns the code even when the verifier is wrong", async () => {
    // A wrong verifier against a real code is an attack, not a typo — the real
    // app always holds the right one. Leaving the row would keep a known-live
    // code available for the rest of its TTL.
    const db = fakeD1();
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER));

    await redeemHandoffCode(db, code, "not-the-verifier");
    expect(db.rows.size).toBe(0);
    expect(await redeemHandoffCode(db, code, VERIFIER)).toBeNull();
  });

  it("refuses an expired code", async () => {
    const db = fakeD1();
    const now = 2_000_000;
    const code = await mintHandoffCode(db, "session-jwt", await challengeFor(VERIFIER), now);

    expect(await redeemHandoffCode(db, code, VERIFIER, now + HANDOFF_TTL_SECONDS + 1)).toBeNull();
  });

  it("refuses an unknown code, and a missing code or verifier", async () => {
    const db = fakeD1();
    expect(await redeemHandoffCode(db, "never-minted", VERIFIER)).toBeNull();
    expect(await redeemHandoffCode(db, null, VERIFIER)).toBeNull();
    expect(await redeemHandoffCode(db, "x", null)).toBeNull();
  });
});

describe("#163 — GET /auth/:provider/start marks the native flow", () => {
  it("records the native flag and the challenge in HttpOnly cookies", async () => {
    const hc = await challengeFor(VERIFIER);
    const res = await startGet({
      request: req(`https://x.test/auth/google/start?native=1&hc=${encodeURIComponent(hc)}`),
      env: CONFIGURED,
      params: { provider: "google" },
    });

    expect(res.status).toBe(302);
    expect(cookieValue(res, "rca_oauth_native")).toBe("1");
    expect(cookieValue(res, "rca_oauth_hc")).toBe(hc);
    // Not readable by anything running in the Custom Tab.
    expect(cookieNamed(res, "rca_oauth_hc")).toContain("HttpOnly");
  });

  it("stays a normal web sign-in when the challenge is malformed", async () => {
    // Falling back rather than failing: a bad `hc` must not be a way to make
    // sign-in break, and the deep-link branch is reachable only with a
    // well-formed one.
    const res = await startGet({
      request: req("https://x.test/auth/google/start?native=1&hc=too-short"),
      env: CONFIGURED,
      params: { provider: "google" },
    });

    expect(res.status).toBe(302);
    expect(cookieNamed(res, "rca_oauth_native")).toBeNull();
    expect(cookieNamed(res, "rca_oauth_hc")).toBeNull();
  });

  it("sets nothing native for an ordinary web sign-in", async () => {
    const res = await startGet({
      request: req("https://x.test/auth/google/start"),
      env: CONFIGURED,
      params: { provider: "google" },
    });
    expect(cookieNamed(res, "rca_oauth_native")).toBeNull();
  });
});

describe("#163 — POST /auth/native/exchange", () => {
  const post = (body, env, headers = {}) =>
    exchangePost({
      request: new Request("https://x.test/auth/native/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", origin: NATIVE_ORIGIN, ...headers },
        body: JSON.stringify(body),
      }),
      env,
    });

  async function seeded() {
    const db = fakeD1();
    const token = await signSession({ uid: 7, email: "s@x.test", name: "Student", role: "student" }, SECRET);
    const code = await mintHandoffCode(db, token, await challengeFor(VERIFIER));
    return { db, code, token };
  }

  it("hands back a session cookie the WebView will actually send", async () => {
    const { db, code } = await seeded();
    const res = await post({ code, verifier: VERIFIER }, { ...CONFIGURED, DB: db });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.authenticated).toBe(true);
    expect(body.user).toMatchObject({ id: 7, email: "s@x.test", role: "student" });

    // SameSite=None is the point: from https://localhost the API is a different
    // site, and a Lax cookie would never be sent back.
    const cookie = cookieNamed(res, "rca_session");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Secure");
    expect(cookie).toContain("HttpOnly");
  });

  it("returns the user with the cookie, so the app needs no second round trip", async () => {
    const { db, code } = await seeded();
    const res = await post({ code, verifier: VERIFIER }, { ...CONFIGURED, DB: db });
    expect((await res.json()).user.name).toBe("Student");
  });

  it("refuses a replayed code", async () => {
    const { db, code } = await seeded();
    const env = { ...CONFIGURED, DB: db };

    expect((await post({ code, verifier: VERIFIER }, env)).status).toBe(200);
    const second = await post({ code, verifier: VERIFIER }, env);
    expect(second.status).toBe(400);
    expect(setCookies(second)).toEqual([]);
  });

  it("refuses an intercepted code with no verifier, and says nothing about why", async () => {
    const { db, code } = await seeded();
    const env = { ...CONFIGURED, DB: db };

    const wrongVerifier = await post({ code, verifier: "guessed" }, env);
    const unknownCode = await post({ code: "never-minted", verifier: VERIFIER }, env);

    expect(wrongVerifier.status).toBe(400);
    expect(unknownCode.status).toBe(400);
    // Identical bodies: a distinguishable answer would confirm which codes are
    // live and worth attacking.
    expect(await wrongVerifier.json()).toEqual(await unknownCode.json());
  });

  it("rejects a malformed body without throwing", async () => {
    const db = fakeD1();
    const res = await exchangePost({
      request: new Request("https://x.test/auth/native/exchange", {
        method: "POST",
        headers: { "content-type": "application/json", origin: NATIVE_ORIGIN },
        body: "not json",
      }),
      env: { ...CONFIGURED, DB: db },
    });
    expect(res.status).toBe(400);
  });

  it("is inert until configured", async () => {
    const res = await post({ code: "x", verifier: "y" }, { DB: fakeD1() });
    expect(res.status).toBe(503);
  });

  it("will not hand out a session the signature does not cover", async () => {
    // The row is the one place a database value becomes a session cookie. A
    // tampered row must not be handed straight back out.
    const db = fakeD1();
    const code = await mintHandoffCode(db, "not.a.real.jwt", await challengeFor(VERIFIER));
    const res = await post({ code, verifier: VERIFIER }, { ...CONFIGURED, DB: db });

    expect(res.status).toBe(400);
    expect(setCookies(res)).toEqual([]);
  });
});

describe("#163 — CORS is exactly the app, and nothing else", () => {
  it("allows the Capacitor origins only", () => {
    expect(isAllowedNativeOrigin("https://localhost")).toBe(true);
    expect(isAllowedNativeOrigin("capacitor://localhost")).toBe(true);
    expect(isAllowedNativeOrigin("https://evil.test")).toBe(false);
    expect(isAllowedNativeOrigin(null)).toBe(false);
  });

  it("echoes the origin rather than answering with a wildcard", () => {
    // `*` is invalid alongside Allow-Credentials, and credentials are the
    // entire point here.
    const h = nativeCorsHeaders(req("https://x.test/auth/me", { origin: NATIVE_ORIGIN }));
    expect(h["access-control-allow-origin"]).toBe(NATIVE_ORIGIN);
    expect(h["access-control-allow-credentials"]).toBe("true");
  });

  it("varies on Origin so a visitor is never served the app's CORS headers", () => {
    expect(nativeCorsHeaders(req("https://x.test/auth/me")).vary).toBe("Origin");
  });

  it("gives an unknown origin no CORS headers at all", () => {
    const h = nativeCorsHeaders(req("https://x.test/auth/me", { origin: "https://evil.test" }));
    expect(h["access-control-allow-origin"]).toBeUndefined();
  });

  it("refuses a preflight from an origin that is not the app", async () => {
    const res = await exchangeOptions({
      request: req("https://x.test/auth/native/exchange", { origin: "https://evil.test" }),
    });
    expect(res.status).toBe(403);
  });

  it("answers a preflight from the app", async () => {
    const res = await exchangeOptions({
      request: req("https://x.test/auth/native/exchange", { origin: NATIVE_ORIGIN }),
    });
    expect(res.status).toBe(204);
    expect(res.headers.get("access-control-allow-origin")).toBe(NATIVE_ORIGIN);
  });
});

describe("#163 — signing out of the app", () => {
  it("clears the cookie with the attributes it was set with", async () => {
    // Cleared as Lax, the browser would treat it as a different cookie and
    // leave the real one in place — the student taps sign out and stays in.
    const res = await logoutPost({
      request: new Request("https://x.test/auth/logout", { method: "POST", headers: { origin: NATIVE_ORIGIN } }),
    });
    const cookie = cookieNamed(res, "rca_session");
    expect(cookie).toContain("SameSite=None");
    expect(cookie).toContain("Max-Age=0");
  });

  it("still clears a Lax cookie for the website", async () => {
    const res = await logoutPost({ request: new Request("https://x.test/auth/logout", { method: "POST" }) });
    expect(cookieNamed(res, "rca_session")).toContain("SameSite=Lax");
  });
});

// --- the callback's fork: deep link, or a cookie in the browser -------------
//
// Exercised through the real route with a real RS256 ID token, because the
// branch is only reachable after PKCE, the token exchange and JWKS
// verification have all passed. Stubbing it out further would test the fork
// and nothing that guards it.

const enc = new TextEncoder();
const b64 = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const b64json = (o) => b64(enc.encode(JSON.stringify(o)));

describe("#163 — the callback hands off instead of setting a cookie", () => {
  let KEY;
  let JWK;
  const KID = "handoff-key";

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

  async function idToken(nonce) {
    const head = b64json({ alg: "RS256", typ: "JWT", kid: KID });
    const body = b64json({
      sub: "student-1",
      aud: "g-id",
      iss: "https://accounts.google.com",
      email: "s@x.test",
      name: "Student",
      nonce,
      exp: Math.floor(Date.now() / 1000) + 600,
    });
    const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", KEY.privateKey, enc.encode(`${head}.${body}`));
    return `${head}.${body}.${b64(sig)}`;
  }

  // D1 for both the users upsert and the hand-off table.
  function callbackDb() {
    const handoff = fakeD1();
    return {
      handoff,
      prepare(sql) {
        if (sql.includes("native_handoff")) return handoff.prepare(sql);
        const stmt = {
          bind: () => stmt,
          run: async () => ({ meta: { changes: 1 } }),
          first: async () => ({ id: 7, email: "s@x.test", name: "Student", picture: null, role: "student" }),
        };
        return stmt;
      },
    };
  }

  async function runCallback({ native }) {
    const nonce = "nonce-value";
    const token = await idToken(nonce);

    const realFetch = globalThis.fetch;
    globalThis.fetch = async (url) => {
      if (String(url).includes("googleapis.com/oauth2/v3/certs")) {
        return new Response(JSON.stringify({ keys: [JWK] }), {
          status: 200,
          headers: { "content-type": "application/json", "cache-control": "max-age=600" },
        });
      }
      return new Response(JSON.stringify({ id_token: token }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    };

    const cookies = [
      "rca_oauth_state=st",
      "rca_oauth_verifier=vf",
      `rca_oauth_nonce=${nonce}`,
      "rca_oauth_next=%2Fportal",
      ...(native ? ["rca_oauth_native=1", `rca_oauth_hc=${await challengeFor(VERIFIER)}`] : []),
    ].join("; ");

    const db = callbackDb();
    try {
      const { onRequestGet } = await import("../functions/auth/[provider]/callback.js");
      const res = await onRequestGet({
        request: req("https://x.test/auth/google/callback?code=abc&state=st", { cookie: cookies }),
        env: { ...CONFIGURED, DB: db },
        params: { provider: "google" },
      });
      return { res, db };
    } finally {
      globalThis.fetch = realFetch;
    }
  }

  it("redirects the app to rca:// with a code, and sets no session cookie", async () => {
    const { res, db } = await runCallback({ native: true });

    expect(res.status).toBe(302);
    const location = new URL(res.headers.get("location"));
    expect(location.protocol).toBe("rca:");
    expect(location.host).toBe("auth");
    expect(location.searchParams.get("code")).toBeTruthy();
    expect(location.searchParams.get("next")).toBe("/portal");

    // The browser must not be left holding a live 30-day session in a jar the
    // student never sees and the app cannot read.
    expect(cookieNamed(res, "rca_session")).toBeNull();
    expect(db.handoff.rows.size).toBe(1);
  });

  it("puts the code in the URL but the session only in the table", async () => {
    const { res, db } = await runCallback({ native: true });
    const code = new URL(res.headers.get("location")).searchParams.get("code");

    // What travels through the deep link is a reference. The session itself
    // never appears in a URL, an Android log, or an interceptor's hands.
    const row = [...db.handoff.rows.values()][0];
    expect(row.session.split(".")).toHaveLength(3);
    expect(res.headers.get("location")).not.toContain(row.session);
    expect(await redeemHandoffCode(db.handoff, code, VERIFIER)).toBe(row.session);
  });

  it("still sets the cookie and redirects normally on the web", async () => {
    const { res, db } = await runCallback({ native: false });

    expect(res.headers.get("location")).toBe("/portal");
    expect(cookieNamed(res, "rca_session")).toContain("SameSite=Lax");
    expect(db.handoff.rows.size).toBe(0);
  });

  it("clears the native transaction cookies on the way out", async () => {
    const { res } = await runCallback({ native: true });
    expect(cookieNamed(res, "rca_oauth_native")).toContain("Max-Age=0");
    expect(cookieNamed(res, "rca_oauth_hc")).toContain("Max-Age=0");
  });
});

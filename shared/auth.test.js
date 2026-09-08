import { describe, it, expect } from "vitest";
import { signSession, verifySession, readCookie, getSession, sessionCookie } from "./auth.js";

const SECRET = "portal_session_secret";

describe("session sign/verify (HS256)", () => {
  it("round-trips a payload", async () => {
    const t = await signSession({ uid: 7, email: "a@b.c", role: "student" }, SECRET);
    const p = await verifySession(t, SECRET);
    expect(p.uid).toBe(7);
    expect(p.email).toBe("a@b.c");
    expect(p.role).toBe("student");
    expect(p.exp).toBeGreaterThan(p.iat);
  });
  /* Both tampers below change a character the decoder actually reads.
     The obvious version of this test — flip the LAST character of the
     signature — is flaky, and was failing about 7% of CI runs: an HMAC-SHA256
     signature is 32 bytes in 43 base64url characters, so the final character
     carries only 4 significant bits and A/B/C/D all decode to the same byte.
     Flipping "A" to "B" there produces a token that is genuinely still valid. */
  it("rejects a tampered signature", async () => {
    const t = await signSession({ uid: 7 }, SECRET);
    const [header, body, sig] = t.split(".");
    // The first character of the signature is fully significant, so any
    // substitution here always changes the bytes being verified.
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(await verifySession(`${header}.${body}.${flipped}`, SECRET)).toBeNull();
  });
  it("rejects a tampered payload", async () => {
    const t = await signSession({ uid: 7, role: "student" }, SECRET);
    const [header, , sig] = t.split(".");
    // The attack the signature exists to stop: keep a real signature, swap the
    // claims underneath it.
    const forged = btoa(JSON.stringify({ uid: 1, role: "admin", exp: 9999999999 }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(await verifySession(`${header}.${forged}.${sig}`, SECRET)).toBeNull();
  });
  it("rejects the wrong secret", async () => {
    const t = await signSession({ uid: 7 }, SECRET);
    expect(await verifySession(t, "other")).toBeNull();
  });
  it("rejects an expired token", async () => {
    const t = await signSession({ uid: 7 }, SECRET, -10); // already expired
    expect(await verifySession(t, SECRET)).toBeNull();
  });
  it("rejects junk / missing", async () => {
    expect(await verifySession("", SECRET)).toBeNull();
    expect(await verifySession("a.b", SECRET)).toBeNull();
    expect(await verifySession("a.b.c.d", SECRET)).toBeNull();
    expect(await verifySession(await signSession({ uid: 1 }, SECRET), "")).toBeNull();
  });
});

describe("cookie helpers", () => {
  it("reads the session cookie from the request", () => {
    const req = new Request("https://x/portal", { headers: { cookie: "foo=1; rca_session=abc.def.ghi; bar=2" } });
    expect(readCookie(req)).toBe("abc.def.ghi");
    expect(readCookie(new Request("https://x/portal"))).toBeNull();
  });
  it("sessionCookie is HttpOnly + Secure", () => {
    const c = sessionCookie("tok");
    expect(c).toMatch(/HttpOnly/);
    expect(c).toMatch(/Secure/);
    expect(c).toMatch(/SameSite=Lax/);
  });
  it("getSession returns the payload for a valid cookie, null otherwise", async () => {
    const tok = await signSession({ uid: 9, role: "instructor" }, SECRET);
    const req = new Request("https://x/portal", { headers: { cookie: `rca_session=${tok}` } });
    const p = await getSession(req, { SESSION_SECRET: SECRET });
    expect(p.uid).toBe(9);
    expect(p.role).toBe("instructor");
    expect(await getSession(new Request("https://x/portal"), { SESSION_SECRET: SECRET })).toBeNull();
  });
});

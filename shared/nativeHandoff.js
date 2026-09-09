// Handing a session from the system browser into the app's WebView (#163).
//
// The problem this solves is not authentication — by the time anything here
// runs, the student has already been through consent, PKCE and JWKS
// verification, and `functions/auth/[provider]/callback.js` has a signed
// session for them. The problem is *where that session ends up*.
//
// Google returns `disallowed_useragent` for OAuth inside an embedded WebView,
// so the consent flow has to run in a Custom Tab. The callback therefore runs
// in the system browser, and its `Set-Cookie` lands in the browser's cookie
// jar. The Capacitor WebView has a separate jar and cannot read it. Resuming
// the app over `rca://` does not change that: the app comes back to the
// foreground still signed out, and its next `/auth/me` is a 401.
//
// So the redirect carries a reference to the session rather than the session.
// The app posts that reference back *from inside the WebView*, and the
// response's Set-Cookie lands in the jar that will actually be used.
//
// The threat that shapes the rest of this file: Android lets **any** installed
// app register `rca://`. An interceptor can be handed the redirect and read
// the code out of it. Two things make that not enough to steal a session:
//
//   1. The code is single-use and lives about a minute.
//   2. Redeeming it also requires a verifier the app generated before it
//      opened the Custom Tab, and which never travelled through the URL.
//
// (2) is the load-bearing one — it is PKCE applied to the hand-off itself. (1)
// only narrows the window.

import { safeEqual } from "./serverUtil.js";

const enc = new TextEncoder();

export const HANDOFF_TTL_SECONDS = 90;

// Long enough that consent, the token exchange and the app's resume all fit;
// short enough that a code recovered from a log later is already dead. 90s
// rather than 60 because a cold Custom Tab on a rural connection is slow, and
// the failure mode of "too short" is a student who cannot sign in at all.

function b64url(bytes) {
  const s = btoa(String.fromCharCode(...new Uint8Array(bytes)));
  return s.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** SHA-256 → base64url. The one hash used for both the code and the verifier. */
export async function sha256b64url(value) {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(String(value)));
  return b64url(digest);
}

/** A fresh hand-off code. 32 bytes from the CSPRNG — this is a bearer value. */
export function newHandoffCode() {
  return b64url(crypto.getRandomValues(new Uint8Array(32)));
}

/**
 * Store `session` behind a one-time code and return the code.
 *
 * `challenge` is the app's `S256(verifier)`, taken from the transaction rather
 * than from the callback's query string — see the `start` endpoint.
 */
export async function mintHandoffCode(db, session, challenge, now = Math.floor(Date.now() / 1000)) {
  const code = newHandoffCode();
  const codeHash = await sha256b64url(code);

  // Sweep first. Abandoned sign-ins — consent screens that were closed, apps
  // killed mid-flow — are the common case, not the rare one, and nothing else
  // ever visits these rows to clean them up.
  await db.prepare("DELETE FROM native_handoff WHERE expires_at <= ?1").bind(now).run();

  await db
    .prepare(
      "INSERT INTO native_handoff (code_hash, challenge, session, expires_at, created_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5)",
    )
    .bind(codeHash, challenge, session, now + HANDOFF_TTL_SECONDS, now)
    .run();

  return code;
}

/**
 * Redeem a code. Returns the session JWT, or null.
 *
 * Single-use is enforced by the DELETE's row count rather than by the SELECT
 * that precedes it: two requests can both read the row, but only one DELETE
 * can report having removed it, and only that one is handed the session. Doing
 * it this way — rather than `DELETE ... RETURNING` — keeps the guarantee in
 * plain SQL that any SQLite honours.
 *
 * Every rejection returns the same `null`. The caller must not tell an
 * interceptor whether the code was wrong, expired, already spent, or right
 * with a wrong verifier; the last of those would confirm a code is live and
 * worth attacking.
 */
export async function redeemHandoffCode(db, code, verifier, now = Math.floor(Date.now() / 1000)) {
  if (!code || !verifier) return null;

  const codeHash = await sha256b64url(code);
  const row = await db
    .prepare("SELECT challenge, session, expires_at FROM native_handoff WHERE code_hash = ?1")
    .bind(codeHash)
    .first();
  if (!row) return null;

  // Burn it whatever happens next. A wrong verifier against a real code is an
  // attack on that code, not a typo to be retried — the legitimate app always
  // has the right verifier. Letting it stand would leave a known-live code in
  // the table for the rest of its TTL.
  const del = await db.prepare("DELETE FROM native_handoff WHERE code_hash = ?1").bind(codeHash).run();
  const removedByUs = del && del.meta && del.meta.changes === 1;
  if (!removedByUs) return null;

  if (Number(row.expires_at) <= now) return null;

  const presented = await sha256b64url(verifier);
  // Constant-time: the compared values are digests, so a timing leak would
  // only expose a hash prefix, but this is the comparison that decides whether
  // a session is handed over and it costs nothing to do properly.
  if (!safeEqual(presented, row.challenge)) return null;

  return row.session;
}

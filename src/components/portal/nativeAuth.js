// The app's half of the sign-in hand-off (#163).
//
// On the website, signing in is a link: the browser follows it, the callback
// sets a cookie on the same origin, done. In the app none of that holds.
// Google refuses OAuth inside an embedded WebView, so consent has to run in a
// Custom Tab — a different browser, with a different cookie jar. The app comes
// back over `rca://auth/callback` holding a one-time code, and swaps it for a
// cookie from inside its own WebView, which is the only way the cookie lands
// somewhere the app will read it.
//
// The verifier below is what makes that code safe to put in a URL. Android
// lets any installed app claim `rca://`, so the redirect can be intercepted;
// the verifier never leaves this app, and without it the code redeems nothing.
import { apiUrl } from "../../lib/apiBase";

const VERIFIER_KEY = "rca_native_handoff_verifier";
const VERIFIER_TTL_MS = 10 * 60 * 1000;

function b64url(bytes) {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function s256(value) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return b64url(new Uint8Array(digest));
}

/**
 * Kept in localStorage rather than a module variable.
 *
 * While the Custom Tab is in front, Android is free to kill the app to reclaim
 * memory — on the low-end phones this portal is built for, that is routine
 * rather than exceptional. A module variable would be gone on resume and the
 * student would be bounced back to the login screen with no explanation. This
 * survives that.
 *
 * It is a short-lived, single-use secret in the app's own sandbox, which no
 * other app can read; it is cleared the moment it is spent.
 */
function rememberVerifier(verifier) {
  try {
    localStorage.setItem(VERIFIER_KEY, JSON.stringify({ v: verifier, t: Date.now() }));
  } catch {
    // Private mode or a full disk. The flow still works for as long as the app
    // stays alive — the exchange reads it back below and falls through to a
    // normal failure if it cannot.
  }
}

function takeVerifier() {
  let raw = null;
  try {
    raw = localStorage.getItem(VERIFIER_KEY);
    localStorage.removeItem(VERIFIER_KEY);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const { v, t } = JSON.parse(raw);
    // A verifier older than the consent flow could possibly take is left over
    // from an abandoned attempt, not this one.
    if (!v || !t || Date.now() - t > VERIFIER_TTL_MS) return null;
    return v;
  } catch {
    return null;
  }
}

/**
 * Open the provider's consent screen in a Custom Tab.
 *
 * Deliberately not the app's own WebView: Google answers that with
 * `disallowed_useragent`, and deliberately not an arbitrary external browser
 * either — a Custom Tab keeps the flow inside our task, so the deep link comes
 * back to us rather than to whatever happens to hold the intent.
 */
export async function beginNativeSignIn(provider, next = "/portal") {
  const verifier = b64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = await s256(verifier);
  rememberVerifier(verifier);

  const url = apiUrl(
    `/auth/${encodeURIComponent(provider)}/start` +
      `?native=1&hc=${encodeURIComponent(challenge)}&next=${encodeURIComponent(next)}`,
  );

  const { Browser } = await import("@capacitor/browser");
  await Browser.open({ url, presentationStyle: "popover" });
}

/**
 * Handle an inbound `rca://auth/callback`.
 *
 * Returns the signed-in user, or throws with a reason the login screen already
 * knows how to phrase. Returns null when the URL is not ours to handle, so the
 * caller can ignore other deep links without special-casing them.
 */
export async function completeNativeSignIn(rawUrl) {
  let url;
  try {
    url = new URL(rawUrl);
  } catch {
    return null;
  }
  if (url.protocol !== "rca:" || url.host !== "auth") return null;

  // The Custom Tab is still covering the app at this point; nothing below
  // renders until it is out of the way.
  try {
    const { Browser } = await import("@capacitor/browser");
    await Browser.close();
  } catch {
    // Already closed, or the plugin is unavailable. Not worth failing over.
  }

  const failed = url.searchParams.get("error");
  if (failed) throw new Error(failed);

  const code = url.searchParams.get("code");
  const verifier = takeVerifier();
  // No verifier means this app did not start the flow it is being handed —
  // either it was killed and lost it, or another app is replaying a code at us.
  if (!code || !verifier) throw new Error("bad_state");

  let res;
  try {
    res = await fetch(apiUrl("/auth/native/exchange"), {
      method: "POST",
      headers: { "content-type": "application/json" },
      // The whole point of this request: it is made from the WebView, so the
      // Set-Cookie on the response lands in the jar the app actually uses.
      credentials: "include",
      body: JSON.stringify({ code, verifier }),
    });
  } catch {
    throw new Error("offline");
  }

  if (!res.ok) throw new Error(res.status === 503 ? "not_configured" : "bad_state");

  const body = await res.json().catch(() => null);
  if (!body || !body.authenticated) throw new Error("bad_state");
  return body.user || null;
}

/** Where the app should land afterwards, as encoded by the callback. */
export function nextFromCallback(rawUrl) {
  try {
    const next = new URL(rawUrl).searchParams.get("next") || "/portal";
    return next.startsWith("/") && !next.startsWith("//") ? next : "/portal";
  } catch {
    return "/portal";
  }
}

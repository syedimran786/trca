// CORS for the requests the Android shell makes (#163).
//
// The app runs the same bundle the website does, but Capacitor serves it from
// `https://localhost`, so every call it makes to the portal API is
// cross-origin. That is the trade for keeping a bundled, offline-capable shell
// instead of pointing the WebView at the live site.
//
// The allowlist is exact and closed. It exists to let *our own app* talk to the
// API, not to open the portal to browsers: a real website that wanted this
// would have to be served from `localhost`, and a page there still could not
// read a response it is not allowed an origin for.

const ALLOWED = new Set([
  "https://localhost", // Capacitor Android, androidScheme: "https"
  "capacitor://localhost", // Capacitor iOS, if the shell ever ships there
  "http://localhost", // `cap run` with live reload
]);

export function isAllowedNativeOrigin(origin) {
  return typeof origin === "string" && ALLOWED.has(origin);
}

/**
 * CORS headers for `request`, or `{}` when the origin is not ours.
 *
 * The origin is echoed rather than answered with `*`: a wildcard is invalid
 * alongside `Allow-Credentials: true`, and credentials are the entire point —
 * without them the session cookie is neither sent nor stored.
 *
 * `Vary: Origin` keeps Cloudflare's cache from serving the app's CORS headers
 * to a website visitor, or the other way round.
 */
export function nativeCorsHeaders(request) {
  const origin = request.headers.get("origin");
  if (!isAllowedNativeOrigin(origin)) return { vary: "Origin" };
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-credentials": "true",
    vary: "Origin",
  };
}

/** Preflight response for the portal routes the app calls. */
export function nativeCorsPreflight(request) {
  const headers = nativeCorsHeaders(request);
  if (!headers["access-control-allow-origin"]) return new Response(null, { status: 403 });
  return new Response(null, {
    status: 204,
    headers: {
      ...headers,
      "access-control-allow-methods": "GET, POST, OPTIONS",
      "access-control-allow-headers": "content-type",
      "access-control-max-age": "86400",
    },
  });
}

/**
 * The session cookie the app needs.
 *
 * `SameSite=Lax` is right for the website and wrong here: from
 * `https://localhost` the API is a different site, so a Lax cookie is never
 * sent and the app is signed out on its next request. `None` is the only value
 * that works cross-site, and it requires `Secure`.
 *
 * This weakens nothing on the web. The two surfaces have separate cookie jars
 * and each is issued its own variant — the browser's stays Lax, and only a
 * response to the app's own exchange carries this one.
 */
export function nativeSessionCookie(token, maxAge = 60 * 60 * 24 * 30) {
  return `rca_session=${token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=${maxAge}`;
}

/**
 * Clearing that same cookie.
 *
 * The attributes have to match the ones it was set with or the browser treats
 * this as a different cookie and leaves the real one in place — and a
 * cross-site response that omits `SameSite=None` is rejected outright, which
 * would leave a student who tapped "sign out" still signed in.
 */
export function clearNativeSessionCookie() {
  return `rca_session=; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=0`;
}

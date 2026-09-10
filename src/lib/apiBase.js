// Where the portal's API lives, seen from wherever this bundle is running.
//
// On the website these are same-origin paths and this is a no-op. Inside the
// Android shell it is not: Capacitor serves the bundled build from
// `https://localhost` (`androidScheme: "https"`), so a relative `/auth/me`
// resolves to `https://localhost/auth/me` — a host with no API on it. Every
// portal request in the app was resolving there, which is why the app's portal
// could only ever report itself offline (#163).
//
// So on native the origin is made explicit. That makes portal requests
// cross-origin, which is the price of keeping the bundled, offline-capable
// shell that #109/#111 built rather than pointing the WebView at the live site
// and giving that up.

const PROD_ORIGIN = "https://restcoderacademy.in";

// Set at build time for a staging APK. Vite inlines it, so it cannot be
// changed after `cap sync` — which is the point: a shipped app should not be
// re-pointable at another origin by anything it later loads.
const CONFIGURED = (import.meta.env && import.meta.env.VITE_API_ORIGIN) || "";

/**
 * True when this bundle is running inside the Capacitor WebView.
 *
 * Read off the global the native bridge injects rather than the user agent,
 * which is spoofable and, on Android, close enough to Chrome's to be a
 * coin-flip. `isNativePlatform` is absent on the web, so the fallback is the
 * web behaviour.
 */
export function isNative() {
  const cap = typeof globalThis !== "undefined" ? globalThis.Capacitor : undefined;
  return Boolean(cap && typeof cap.isNativePlatform === "function" && cap.isNativePlatform());
}

/** The API origin, or "" on the web so paths stay relative. */
export function apiOrigin() {
  if (!isNative()) return "";
  return CONFIGURED || PROD_ORIGIN;
}

/** `apiUrl("/auth/me")` — absolute in the app, untouched on the web. */
export function apiUrl(path) {
  return `${apiOrigin()}${path}`;
}

/**
 * The credentials mode to pair with `apiUrl`.
 *
 * `same-origin` would drop the session cookie on every request the app makes,
 * because from `https://localhost` the API is a different origin. `include` is
 * required there and is deliberately *not* used on the web, where
 * `same-origin` remains the tighter choice.
 */
export function apiCredentials() {
  return isNative() ? "include" : "same-origin";
}

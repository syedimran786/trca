/**
 * Reading GET /auth/me, as #114 defines it (#110, #111).
 *
 * Kept as a pure function rather than living inside the hook so the contract
 * between this UI and the auth backend is testable without a DOM — and so a
 * change to that contract fails a test here rather than showing up as a blank
 * portal in someone's hand.
 *
 * The states are deliberately four, not two. "Signed out", "the portal is not
 * switched on yet" and "your phone could not reach us" all render as "no user"
 * if you only track a boolean, and all three need different words on screen —
 * on a metered rural connection the third is the common case, not the edge one.
 */

/**
 * @param {number} httpStatus  status from /auth/me
 * @param {object|null} body   parsed JSON body, or null if it did not parse
 * @returns {{status: "authenticated"|"anonymous"|"unconfigured", user: object|null, providers: string[]}}
 */
export function readMeResponse(httpStatus, body) {
  const data = body || {};

  // 503 is the inert-until-configured case: the backend answers this when the
  // portal has no database or no OAuth secrets, rather than 500ing. Offering a
  // student a sign-in button here sends them to a provider error page.
  if (httpStatus === 503) {
    return { status: "unconfigured", user: null, providers: [] };
  }

  // `providers` is not part of the #114 contract today. If it is ever added,
  // it is authoritative and the login screen renders exactly those buttons;
  // until then both are offered. Read defensively either way — this is the
  // one field that decides what a student is allowed to tap.
  const providers = Array.isArray(data.providers)
    ? data.providers.filter((p) => p === "google" || p === "microsoft")
    : ["google", "microsoft"];

  if (httpStatus === 200 && data.id) {
    return {
      status: "authenticated",
      user: {
        id: data.id,
        name: data.name || "",
        email: data.email || "",
        // The backend returns `avatar_url`; the UI has always called it
        // `picture`. Renamed here, once, instead of in three components.
        picture: data.avatar_url || null,
        role: data.role || "student",
      },
      providers,
    };
  }

  return { status: "anonymous", user: null, providers };
}

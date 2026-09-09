// POST /auth/logout — clear the session cookie. POST rather than GET so a
// prefetch or an <img> cannot sign a student out.
import { clearSessionCookie } from "../../shared/auth.js";
import {
  clearNativeSessionCookie,
  isAllowedNativeOrigin,
  nativeCorsHeaders,
  nativeCorsPreflight,
} from "../../shared/nativeCors.js";

export const onRequestOptions = ({ request }) => nativeCorsPreflight(request);

export async function onRequestPost({ request }) {
  // The cookie has to be cleared with the attributes it was set with, and the
  // app's was issued `SameSite=None` so it would be sent cross-site at all
  // (#163). Clearing it as `Lax` from a cross-site response would be rejected,
  // and the student would tap "sign out" and stay signed in.
  const native = isAllowedNativeOrigin(request.headers.get("origin"));

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      ...nativeCorsHeaders(request),
      "set-cookie": native ? clearNativeSessionCookie() : clearSessionCookie(),
    },
  });
}

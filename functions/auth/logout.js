// POST /auth/logout — clear the session cookie. POST rather than GET so a
// prefetch or an <img> cannot sign a student out.
import { clearSessionCookie } from "../../shared/auth.js";

export async function onRequestPost() {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": clearSessionCookie(),
    },
  });
}

// POST /auth/native/exchange — turn a one-time hand-off code into a session
// cookie in the app's WebView (#163).
//
// This is the request that fixes the cookie-jar mismatch, purely by virtue of
// who makes it. The consent flow ran in a Custom Tab, so the callback's
// Set-Cookie went to the system browser. This request comes *from the WebView*,
// so this response's Set-Cookie goes where the app will actually read it. The
// hand-off code is only the means of carrying the session across; the jar is
// decided by the caller.
import { verifySession } from "../../../shared/auth.js";
import { redeemHandoffCode } from "../../../shared/nativeHandoff.js";
import { nativeCorsHeaders, nativeCorsPreflight, nativeSessionCookie } from "../../../shared/nativeCors.js";

const json = (body, status, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

export const onRequestOptions = ({ request }) => nativeCorsPreflight(request);

export async function onRequestPost(context) {
  const { request, env } = context;
  const cors = nativeCorsHeaders(request);

  // Same shape of refusal for every failure below. An interceptor holding a
  // code it cannot redeem must not learn whether the code was unknown, spent,
  // expired, or real-but-paired-with-the-wrong-verifier — the last would tell
  // it the code is live and worth continuing to attack.
  const refuse = () => json({ error: "invalid_code" }, 400, cors);

  if (!env.SESSION_SECRET || !env.DB) return json({ error: "not_configured" }, 503, cors);

  let body;
  try {
    body = await request.json();
  } catch {
    return refuse();
  }

  const code = body && typeof body.code === "string" ? body.code : null;
  const verifier = body && typeof body.verifier === "string" ? body.verifier : null;
  if (!code || !verifier) return refuse();

  let token;
  try {
    token = await redeemHandoffCode(env.DB, code, verifier);
  } catch {
    return json({ error: "storage" }, 503, cors);
  }
  if (!token) return refuse();

  // The row held a JWT we signed ourselves a moment ago, so this should never
  // fail. It is checked anyway because this is the one place a value out of the
  // database becomes a session cookie: were a row ever tampered with, the HMAC
  // is what stops the tampered token being handed straight back out.
  const session = await verifySession(token, env.SESSION_SECRET);
  if (!session) return refuse();

  // The user is returned with the cookie so the app can render the student home
  // immediately. On the metered rural connections this portal is built for
  // (#111), a second round trip to /auth/me right after sign-in is a real cost
  // for something we already have in hand.
  return json(
    {
      authenticated: true,
      user: {
        id: session.uid,
        email: session.email,
        name: session.name,
        picture: session.picture,
        role: session.role || "student",
      },
    },
    200,
    { ...cors, "set-cookie": nativeSessionCookie(token) },
  );
}

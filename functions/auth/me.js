// GET /auth/me — who the caller is, or 401. The portal's route guard calls
// this on load; it is also what tells the login screen whether any provider is
// configured, so the UI never has to guess.
import { getSession } from "../../shared/auth.js";
import { configuredProviders } from "../../shared/oidc.js";
import { nativeCorsHeaders, nativeCorsPreflight } from "../../shared/nativeCors.js";

const json = (body, status, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    // A session-bearing response must never be cached by a proxy or the app shell.
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

// The Android shell calls this from `https://localhost`, so it is cross-origin
// there and needs both the preflight and the credentialed CORS headers (#163).
export const onRequestOptions = ({ request }) => nativeCorsPreflight(request);

export async function onRequestGet(context) {
  const { request, env } = context;
  const cors = nativeCorsHeaders(request);
  const providers = configuredProviders(env);
  const session = await getSession(request, env);
  if (!session) return json({ authenticated: false, providers }, 401, cors);
  return json(
    {
      authenticated: true,
      providers,
      user: {
        id: session.uid,
        email: session.email,
        name: session.name,
        picture: session.picture,
        role: session.role || "student",
      },
    },
    200,
    cors,
  );
}

// GET /auth/me — who the caller is, or 401. The portal's route guard calls
// this on load; it is also what tells the login screen whether any provider is
// configured, so the UI never has to guess.
import { getSession } from "../../shared/auth.js";
import { configuredProviders } from "../../shared/oidc.js";

const json = (body, status) =>
  new Response(JSON.stringify(body), {
    status,
    // A session-bearing response must never be cached by a proxy or the app shell.
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestGet(context) {
  const { request, env } = context;
  const providers = configuredProviders(env);
  const session = await getSession(request, env);
  if (!session) return json({ authenticated: false, providers }, 401);
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
  );
}

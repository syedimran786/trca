// GET /api/portal/courses/:slug — one enrolled course with its lessons (#136).
//
// A student who is not enrolled gets the same 404 as a slug that does not
// exist. A 403 would confirm the course is real, which is not something an
// outsider should be able to learn by guessing slugs.
import { getSession } from "../../../../shared/auth.js";
import { getEnrolledCourse } from "../../../../shared/courses.js";
import { nativeCorsHeaders, nativeCorsPreflight } from "../../../../shared/nativeCors.js";

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

// Cross-origin from the Android shell, which serves the bundle off
// `https://localhost` (#163).
export const onRequestOptions = ({ request }) => nativeCorsPreflight(request);

export async function onRequestGet(context) {
  const { request, env, params } = context;
  const cors = nativeCorsHeaders(request);

  const session = await getSession(request, env);
  if (!session) return json({ error: "unauthenticated" }, 401, cors);
  if (!env.DB) return json({ error: "unavailable" }, 503, cors);

  const slug = String(params.slug || "");
  if (!slug) return json({ error: "not_found" }, 404, cors);

  try {
    const course = await getEnrolledCourse(env.DB, session.uid, slug);
    if (!course) return json({ error: "not_found" }, 404, cors);
    return json({ course }, 200, cors);
  } catch {
    return json({ error: "unavailable" }, 503, cors);
  }
}

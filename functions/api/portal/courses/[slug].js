// GET /api/portal/courses/:slug — one enrolled course with its lessons (#136).
//
// A student who is not enrolled gets the same 404 as a slug that does not
// exist. A 403 would confirm the course is real, which is not something an
// outsider should be able to learn by guessing slugs.
import { getSession } from "../../../../shared/auth.js";
import { getEnrolledCourse } from "../../../../shared/courses.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestGet(context) {
  const { request, env, params } = context;

  const session = await getSession(request, env);
  if (!session) return json({ error: "unauthenticated" }, 401);
  if (!env.DB) return json({ error: "unavailable" }, 503);

  const slug = String(params.slug || "");
  if (!slug) return json({ error: "not_found" }, 404);

  try {
    const course = await getEnrolledCourse(env.DB, session.uid, slug);
    if (!course) return json({ error: "not_found" }, 404);
    return json({ course });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

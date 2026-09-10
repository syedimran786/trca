// GET /api/portal/courses — the signed-in student's enrolled courses (#136).
// Session-guarded: no cookie, no course data. Never cached, because the
// response is specific to one student.
import { getSession } from "../../../shared/auth.js";
import { listEnrolledCourses } from "../../../shared/courses.js";
import { nativeCorsHeaders, nativeCorsPreflight } from "../../../shared/nativeCors.js";

const json = (body, status = 200, extra = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store", ...extra },
  });

// Cross-origin from the Android shell, which serves the bundle off
// `https://localhost` (#163).
export const onRequestOptions = ({ request }) => nativeCorsPreflight(request);

export async function onRequestGet(context) {
  const { request, env } = context;
  const cors = nativeCorsHeaders(request);

  const session = await getSession(request, env);
  if (!session) return json({ error: "unauthenticated" }, 401, cors);

  // No D1 binding is a server fault, not an empty course list. Returning []
  // here would tell a student who has enrolments that they have none.
  if (!env.DB) return json({ error: "unavailable" }, 503, cors);

  try {
    const courses = await listEnrolledCourses(env.DB, session.uid);
    return json({ courses }, 200, cors);
  } catch {
    return json({ error: "unavailable" }, 503, cors);
  }
}

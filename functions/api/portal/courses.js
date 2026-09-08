// GET /api/portal/courses — the signed-in student's enrolled courses (#136).
// Session-guarded: no cookie, no course data. Never cached, because the
// response is specific to one student.
import { getSession } from "../../../shared/auth.js";
import { listEnrolledCourses } from "../../../shared/courses.js";

const json = (body, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export async function onRequestGet(context) {
  const { request, env } = context;

  const session = await getSession(request, env);
  if (!session) return json({ error: "unauthenticated" }, 401);

  // No D1 binding is a server fault, not an empty course list. Returning []
  // here would tell a student who has enrolments that they have none.
  if (!env.DB) return json({ error: "unavailable" }, 503);

  try {
    const courses = await listEnrolledCourses(env.DB, session.uid);
    return json({ courses });
  } catch {
    return json({ error: "unavailable" }, 503);
  }
}

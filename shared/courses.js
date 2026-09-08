// Course + lesson reads for the student portal (#136).
//
// These take the D1 binding rather than reaching for it, so the API routes stay
// thin and the query shapes are unit-testable against a fake database.

// The courses a student is actually enrolled in. Unpublished courses are
// withheld even from an enrolled student: `published` is the academy's switch
// for "this is ready to be seen", and an enrolment does not override it.
export async function listEnrolledCourses(db, userId) {
  const { results } = await db
    .prepare(
      "SELECT c.id, c.slug, c.title, c.summary, c.cover_url, " +
        "(SELECT COUNT(*) FROM lessons l WHERE l.course_id = c.id AND l.published = 1) AS lesson_count " +
        "FROM enrolments_users eu " +
        "JOIN courses c ON c.id = eu.course_id " +
        "WHERE eu.user_id = ?1 AND c.published = 1 " +
        "ORDER BY c.title ASC"
    )
    .bind(userId)
    .all();
  return results || [];
}

// One course with its lessons, but only if this student is enrolled in it.
//
// Returns null both for "no such course" and for "not enrolled", deliberately.
// The caller turns that into a 404 either way, so an outsider probing slugs
// cannot tell a real course they lack access to from one that does not exist.
export async function getEnrolledCourse(db, userId, slug) {
  const course = await db
    .prepare(
      "SELECT c.id, c.slug, c.title, c.summary, c.cover_url " +
        "FROM enrolments_users eu " +
        "JOIN courses c ON c.id = eu.course_id " +
        "WHERE eu.user_id = ?1 AND c.slug = ?2 AND c.published = 1"
    )
    .bind(userId, slug)
    .first();
  if (!course) return null;

  const { results } = await db
    .prepare(
      "SELECT id, position, title, notes, video_url, duration_seconds " +
        "FROM lessons WHERE course_id = ?1 AND published = 1 " +
        "ORDER BY position ASC"
    )
    .bind(course.id)
    .all();

  return { ...course, lessons: results || [] };
}

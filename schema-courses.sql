-- Phase 2: course + lesson content for the student portal (#136).
-- Lives in the same D1 database as the Phase 1 `users` table so a student's
-- enrolments join to their account without a second datastore.

CREATE TABLE IF NOT EXISTS courses (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT NOT NULL,                          -- URL id, e.g. 'fde'
  title      TEXT NOT NULL,
  summary    TEXT,
  cover_url  TEXT,
  published  INTEGER NOT NULL DEFAULT 0,             -- 0 until it is ready to show
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_slug ON courses (slug);

CREATE TABLE IF NOT EXISTS lessons (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  course_id        INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  position         INTEGER NOT NULL,                 -- order within the course, 1-based
  title            TEXT NOT NULL,
  notes            TEXT,                             -- markdown, the data-light half of a lesson
  video_url        TEXT,                             -- filled in by the Phase 2 upload ticket
  duration_seconds INTEGER,
  published        INTEGER NOT NULL DEFAULT 0,
  created_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The course page reads lessons for one course in order; this is that query.
CREATE INDEX IF NOT EXISTS idx_lessons_course_position ON lessons (course_id, position);

-- The resolved link between a portal account and a course.
--
-- The existing `enrollments` table cannot serve this. It predates the portal:
-- it identifies a person by the email typed into the enquiry form and a course
-- by a free-text string, and a row is written before the student has ever
-- signed in. Joining portal reads to it directly would mean matching on email
-- on every request and trusting a string to name a course. So enrolment is
-- resolved once, into this table, keyed by the ids that actually exist.
CREATE TABLE IF NOT EXISTS enrolments_users (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id       INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id     INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  -- Which `enrollments` row this came from, when it came from one. Null for a
  -- link an admin created by hand.
  enrollment_id INTEGER,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- A student is enrolled in a course once, not once per sign-in.
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrolments_users_pair
  ON enrolments_users (user_id, course_id);

-- Backfill, run after a student first signs in. Matches the enquiry-form email
-- to the account email and the enrolment's course string to a course slug.
-- Case-insensitive on email because the two came from different keyboards.
--
--   INSERT OR IGNORE INTO enrolments_users (user_id, course_id, enrollment_id)
--   SELECT u.id, c.id, e.id
--     FROM enrollments e
--     JOIN users   u ON lower(u.email) = lower(e.email)
--     JOIN courses c ON c.slug = e.course
--    WHERE e.email IS NOT NULL;

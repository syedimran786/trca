-- Portal schema — users, sessions, parent↔student links.
-- Applies to the same D1 database as the existing tables (binding `DB` in
-- wrangler.toml). Run locally:
--   npx wrangler d1 execute restcoder-enquiries --local --file=schema-portal.sql
-- Run against the remote DB:
--   npx wrangler d1 execute restcoder-enquiries --remote --file=schema-portal.sql
--
-- Covers issues #112 (users + sessions) and #146 (parent role + parent_students).
-- #146 is folded here so the parent role ships with the initial migration and
-- never needs a retrofitted ALTER TABLE.

-- ---------------------------------------------------------------------------
-- portal_users
-- ---------------------------------------------------------------------------
-- `provider` and `provider_subject` are nullable to allow admin-pre-created
-- parent rows (email + role set before the parent has SSO'd in). Once the
-- parent completes their first OIDC login the upsert fills both columns.
CREATE TABLE IF NOT EXISTS portal_users (
  id               TEXT PRIMARY KEY,            -- crypto.randomUUID() from app
  provider         TEXT CHECK (provider IN ('google', 'microsoft') OR provider IS NULL),
  provider_subject TEXT,                        -- provider's stable user-id (sub claim)
  email            TEXT NOT NULL,
  name             TEXT NOT NULL,
  avatar_url       TEXT,
  role             TEXT NOT NULL DEFAULT 'student'
                   CHECK (role IN ('student', 'instructor', 'admin', 'parent')),
  created_at       TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Unique per provider+subject so the same Google/MS account always maps to
-- the same row. Partial (WHERE provider IS NOT NULL) so admin-pre-created
-- rows with no provider yet don't conflict with each other.
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_users_provider
  ON portal_users (provider, provider_subject)
  WHERE provider IS NOT NULL;

-- Email must be unique across all portal users.
CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_users_email
  ON portal_users (email);

-- ---------------------------------------------------------------------------
-- portal_sessions
-- ---------------------------------------------------------------------------
-- Explicit session rows (rather than purely stateless signed cookies) so a
-- session can be revoked server-side without rotating the signing secret.
-- `revoked_at` NULL means the session is still active.
CREATE TABLE IF NOT EXISTS portal_sessions (
  id          TEXT PRIMARY KEY,                 -- crypto.randomUUID() from app
  user_id     TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  issued_at   TEXT NOT NULL DEFAULT (datetime('now')),
  expires_at  TEXT NOT NULL,
  revoked_at  TEXT                              -- NULL = active
);

CREATE INDEX IF NOT EXISTS idx_portal_sessions_user
  ON portal_sessions (user_id);

-- ---------------------------------------------------------------------------
-- parent_students  (#146)
-- ---------------------------------------------------------------------------
-- Links a parent portal_user to one or more student portal_users.
-- A student can have multiple parents (or none, for self-enrolled adults).
-- Parents only READ student data — no write access.
-- `relation` is display-only ("mother", "father", "guardian") and optional.
CREATE TABLE IF NOT EXISTS parent_students (
  id              TEXT PRIMARY KEY,             -- crypto.randomUUID() from app
  parent_user_id  TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  student_user_id TEXT NOT NULL REFERENCES portal_users(id) ON DELETE CASCADE,
  relation        TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Prevent duplicate parent↔student pairs.
CREATE UNIQUE INDEX IF NOT EXISTS idx_parent_students_pair
  ON parent_students (parent_user_id, student_user_id);

-- Student-portal user accounts (Phase 1). Populated on first Google/Microsoft
-- sign-in; the portal keys everything student-specific off `id`.
CREATE TABLE IF NOT EXISTS users (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  provider   TEXT NOT NULL,                          -- 'google' | 'microsoft'
  subject    TEXT NOT NULL,                          -- provider's stable user id ('sub')
  email      TEXT,
  name       TEXT,
  picture    TEXT,
  role       TEXT NOT NULL DEFAULT 'student',        -- 'student' | 'instructor' | 'admin'
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login TEXT
);

-- One account per (provider, subject) — the login upsert matches on this.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_provider_subject
  ON users (provider, subject);

-- Looked up when an admin searches for a student by address.
CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

-- No `sessions` table on purpose: the portal is stateless. The session is a
-- signed HS256 JWT in an HttpOnly cookie (shared/auth.js), so a normal request
-- verifies a signature instead of paying a D1 read. The trade-off is that
-- logout clears the cookie rather than revoking a row, so a stolen token stays
-- valid for the rest of its 30-day TTL and cannot be killed server-side. That
-- is acceptable while the portal only shows a student their own course pages.
-- Add this table (and shorten the TTL) before it holds anything heavier --
-- payments, instructor grading, anything an admin role can reach.

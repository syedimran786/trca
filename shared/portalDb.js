// Portal D1 helpers — used by the OIDC callback (#113) and admin functions.
// All functions take the D1 database binding (`env.DB`) as the first argument.

// ---------------------------------------------------------------------------
// upsertPortalUser
// ---------------------------------------------------------------------------
// Called on every successful OIDC callback. Guarantees that the same
// provider+subject always maps to the same portal_users row and never
// creates a duplicate. Returns { id, role, created }.
//
// Three cases:
//   1. Row found by (provider, provider_subject) → update name/avatar/email
//      and last_login_at. Role is preserved (admin may have elevated it).
//   2. Row found by email only (admin pre-created parent row before first SSO)
//      → fill in the provider/subject columns, update last_login_at.
//   3. No row found → insert new user with role='student'.
export async function upsertPortalUser(db, { provider, providerSubject, email, name, avatarUrl }) {
  const now = new Date().toISOString();

  // Case 1: known provider+subject
  const byProvider = await db
    .prepare(
      "SELECT id, role FROM portal_users WHERE provider = ?1 AND provider_subject = ?2"
    )
    .bind(provider, providerSubject)
    .first();

  if (byProvider) {
    await db
      .prepare(
        "UPDATE portal_users SET email = ?1, name = ?2, avatar_url = ?3, last_login_at = ?4 WHERE id = ?5"
      )
      .bind(email, name, avatarUrl || null, now, byProvider.id)
      .run();
    return { id: byProvider.id, role: byProvider.role, created: false };
  }

  // Case 2: admin pre-created row matched by email (no provider yet)
  const byEmail = await db
    .prepare(
      "SELECT id, role FROM portal_users WHERE email = ?1 AND provider IS NULL"
    )
    .bind(email)
    .first();

  if (byEmail) {
    await db
      .prepare(
        "UPDATE portal_users SET provider = ?1, provider_subject = ?2, name = ?3, avatar_url = ?4, last_login_at = ?5 WHERE id = ?6"
      )
      .bind(provider, providerSubject, name, avatarUrl || null, now, byEmail.id)
      .run();
    return { id: byEmail.id, role: byEmail.role, created: false };
  }

  // Case 3: new user
  const id = crypto.randomUUID();
  await db
    .prepare(
      "INSERT INTO portal_users (id, provider, provider_subject, email, name, avatar_url, created_at, last_login_at) " +
        "VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)"
    )
    .bind(id, provider, providerSubject, email, name, avatarUrl || null, now, now)
    .run();
  return { id, role: "student", created: true };
}

// ---------------------------------------------------------------------------
// createPortalSession
// ---------------------------------------------------------------------------
// Inserts a new session row. `ttlSeconds` defaults to 7 days.
// Returns the session id (store in a signed HttpOnly cookie).
export async function createPortalSession(db, userId, ttlSeconds = 60 * 60 * 24 * 7) {
  const id = crypto.randomUUID();
  const now = new Date();
  const expires = new Date(now.getTime() + ttlSeconds * 1000);
  await db
    .prepare(
      "INSERT INTO portal_sessions (id, user_id, issued_at, expires_at) VALUES (?1, ?2, ?3, ?4)"
    )
    .bind(id, userId, now.toISOString(), expires.toISOString())
    .run();
  return id;
}

// ---------------------------------------------------------------------------
// resolvePortalSession
// ---------------------------------------------------------------------------
// Validates a session id (from the cookie). Returns { userId, role } or null
// if the session is missing, expired, or revoked.
export async function resolvePortalSession(db, sessionId) {
  if (!sessionId) return null;
  const now = new Date().toISOString();
  const row = await db
    .prepare(
      "SELECT s.user_id, u.role FROM portal_sessions s " +
        "JOIN portal_users u ON u.id = s.user_id " +
        "WHERE s.id = ?1 AND s.revoked_at IS NULL AND s.expires_at > ?2"
    )
    .bind(sessionId, now)
    .first();
  return row ? { userId: row.user_id, role: row.role } : null;
}

// ---------------------------------------------------------------------------
// revokePortalSession
// ---------------------------------------------------------------------------
export async function revokePortalSession(db, sessionId) {
  await db
    .prepare("UPDATE portal_sessions SET revoked_at = ?1 WHERE id = ?2")
    .bind(new Date().toISOString(), sessionId)
    .run();
}

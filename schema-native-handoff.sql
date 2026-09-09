-- One-time hand-off codes that carry a session from the system browser into
-- the Android app's WebView (#163).
--
-- Why a table at all, when the portal is otherwise stateless (schema-users.sql):
-- the two cookie jars are the whole problem. OAuth consent has to run in a
-- Custom Tab because Google refuses embedded WebViews, so the callback's
-- Set-Cookie lands in the *browser's* jar. The app's WebView has its own. The
-- only thing that can cross is a value in the redirect URL, and a session in a
-- URL is a session in the Android logs and in every app that registered the
-- same scheme. So the URL carries a reference instead, and this is what it
-- refers to.
--
-- Rows are short-lived by design: minted at the end of a verified callback,
-- deleted the moment they are redeemed, and useless after HANDOFF_TTL_SECONDS.
CREATE TABLE IF NOT EXISTS native_handoff (
  -- SHA-256 of the code, never the code. A row is a bearer session for its
  -- ~60s life, and this table will end up in a D1 backup and on an admin
  -- screen; storing the digest means neither yields anything redeemable.
  code_hash  TEXT PRIMARY KEY,

  -- SHA-256 of the verifier the app generated *before* it opened the Custom
  -- Tab. Android lets any app claim `rca://`, so an interceptor can read the
  -- code straight out of the redirect. It cannot produce the verifier, which
  -- never left the legitimate app, so the code alone redeems nothing.
  challenge  TEXT NOT NULL,

  -- The signed session JWT this code hands over, minted by the callback from
  -- the transaction that has already been through PKCE and JWKS verification.
  session    TEXT NOT NULL,

  expires_at INTEGER NOT NULL,                      -- unix seconds
  created_at INTEGER NOT NULL
);

-- Swept opportunistically on mint, so an abandoned sign-in does not leave a
-- row behind for good.
CREATE INDEX IF NOT EXISTS idx_native_handoff_expires
  ON native_handoff (expires_at);

import { useCallback, useEffect, useState } from "react";

/**
 * The portal's session, read from GET /auth/me (#110).
 *
 * `status` is the whole state machine, so no screen has to infer "still
 * loading" from an absent user:
 *   loading        — the first /auth/me is in flight
 *   authenticated  — signed in; `user` is set
 *   anonymous      — not signed in; `providers` says what can be offered
 *   offline        — the request itself failed, which on a metered rural
 *                    connection is the common case rather than the edge one,
 *                    and is not the same thing as being signed out (#111)
 */
export function usePortalSession() {
  const [status, setStatus] = useState("loading");
  const [user, setUser] = useState(null);
  const [providers, setProviders] = useState([]);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/auth/me", { credentials: "same-origin" });
      const body = await res.json().catch(() => ({}));
      setProviders(Array.isArray(body.providers) ? body.providers : []);
      if (res.ok && body.authenticated) {
        setUser(body.user || null);
        setStatus("authenticated");
      } else {
        setUser(null);
        setStatus("anonymous");
      }
    } catch {
      // A network failure is not a sign-out. Saying "please sign in" here
      // would send a student round a login loop they cannot complete.
      setUser(null);
      setStatus("offline");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const logout = useCallback(async () => {
    try {
      await fetch("/auth/logout", { method: "POST", credentials: "same-origin" });
    } catch {
      // Ignore: the cookie may already be gone, and the screen below still
      // needs to return the student to the login page either way.
    }
    setUser(null);
    setStatus("anonymous");
  }, []);

  return { status, user, providers, reload: load, logout };
}

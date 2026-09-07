import { useCallback, useEffect, useState } from "react";
import { readMeResponse } from "./session-contract";

/**
 * The portal's session, read from GET /auth/me (#110).
 *
 * `status` is the whole state machine, so no screen has to infer "still
 * loading" from an absent user:
 *   loading        — the first /auth/me is in flight
 *   authenticated  — signed in; `user` is set
 *   anonymous      — not signed in; `providers` says what can be offered
 *   unconfigured   — the portal has no OAuth secrets or no database yet, so
 *                    there is nothing to sign in to (#42's "coming soon")
 *   offline        — the request itself failed, which on a metered rural
 *                    connection is the common case rather than the edge one,
 *                    and is not the same thing as being signed out (#111)
 *
 * The backend is #112/#113/#114. This file owns none of it — it owns only the
 * reading of it, which is why the response mapping sits in session-contract.js
 * where it can be tested.
 */
export function usePortalSession() {
  const [state, setState] = useState({ status: "loading", user: null, providers: [] });

  const load = useCallback(async () => {
    try {
      const res = await fetch("/auth/me", { credentials: "same-origin" });
      const body = await res.json().catch(() => null);
      setState(readMeResponse(res.status, body));
    } catch {
      // A network failure is not a sign-out. Saying "please sign in" here
      // would send a student round a login loop they cannot complete.
      setState({ status: "offline", user: null, providers: [] });
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
    setState({ status: "anonymous", user: null, providers: ["google", "microsoft"] });
  }, []);

  return { ...state, reload: load, logout };
}

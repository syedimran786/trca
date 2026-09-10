import { useCallback, useEffect, useState } from "react";
import { apiCredentials, apiUrl, isNative } from "../../lib/apiBase";
import { completeNativeSignIn } from "./nativeAuth";

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
  // Set when a native hand-off fails; the login screen renders it the same way
  // it renders the ?error= the web callback redirects with.
  const [authError, setAuthError] = useState(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch(apiUrl("/auth/me"), { credentials: apiCredentials() });
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

  /**
   * The app coming back from the Custom Tab (#163).
   *
   * Registered here rather than on the login screen because the deep link can
   * arrive at any time — Android may have destroyed and rebuilt the activity
   * while consent was on screen, so whatever route the app resumes on has to
   * be able to receive it. This hook is mounted for the whole portal.
   *
   * The listener is what actually finishes sign-in: `appUrlOpen` only tells us
   * the app was resumed, and resuming is not the same as being signed in.
   */
  useEffect(() => {
    if (!isNative()) return undefined;

    let cancelled = false;
    let remove = null;

    (async () => {
      const { App } = await import("@capacitor/app");
      const handle = await App.addListener("appUrlOpen", async ({ url }) => {
        try {
          const signedIn = await completeNativeSignIn(url);
          if (cancelled || signedIn === null) return;
          setUser(signedIn);
          setStatus("authenticated");
          setAuthError(null);
        } catch (err) {
          if (cancelled) return;
          // Back to the login screen with something to say, rather than a
          // silent bounce the student cannot act on.
          setAuthError(err && err.message ? err.message : "bad_state");
          setUser(null);
          setStatus("anonymous");
        }
      });
      if (cancelled) handle.remove();
      else remove = () => handle.remove();
    })();

    return () => {
      cancelled = true;
      if (remove) remove();
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await fetch(apiUrl("/auth/logout"), { method: "POST", credentials: apiCredentials() });
    } catch {
      // Ignore: the cookie may already be gone, and the screen below still
      // needs to return the student to the login page either way.
    }
    setUser(null);
    setStatus("anonymous");
  }, []);

  return { status, user, providers, authError, reload: load, logout };
}

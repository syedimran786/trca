import PropTypes from "prop-types";
import { useLocation, Navigate, Link } from "react-router-dom";
import { usePortalSession } from "./usePortalSession";
import PortalSkeleton from "./PortalSkeleton";
import "./Portal.css";

/**
 * /portal/login (#110).
 *
 * Reuses the site's brand and tokens — no new design language, per the ticket.
 *
 * Inert until configured: `providers` comes from /auth/me, which reports which
 * providers actually have a client id and secret. With none, the screen says
 * "coming soon" instead of rendering buttons that would send a student to a
 * provider error page.
 */

const PROVIDER_LABEL = { google: "Google", microsoft: "Microsoft" };

// The provider tells us why in a query string; nothing from it reaches the DOM.
const ERRORS = {
  cancelled: "Sign-in was cancelled. You can try again.",
  bad_state: "That sign-in link expired. Please try again.",
  token_exchange: "We could not complete sign-in with that provider. Please try again.",
  bad_token: "We could not verify that sign-in. Please try again.",
  storage: "We could not save your account just now. Please try again shortly.",
  not_configured: "Student sign-in is not switched on yet.",
};

function ProviderMark({ name }) {
  if (name === "google") {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true" className="portal-provider-mark">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="portal-provider-mark">
      <path fill="#F25022" d="M2 2h9.5v9.5H2z" />
      <path fill="#7FBA00" d="M12.5 2H22v9.5h-9.5z" />
      <path fill="#00A4EF" d="M2 12.5h9.5V22H2z" />
      <path fill="#FFB900" d="M12.5 12.5H22V22h-9.5z" />
    </svg>
  );
}

ProviderMark.propTypes = { name: PropTypes.string.isRequired };

function PortalLogin() {
  const { status, providers } = usePortalSession();
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const errorKey = params.get("error");
  const error = errorKey ? ERRORS[errorKey] || ERRORS.token_exchange : null;

  if (status === "loading") return <PortalSkeleton />;
  if (status === "authenticated") return <Navigate to="/portal" replace />;

  const next = (location.state && location.state.from) || "/portal";
  const offline = status === "offline";

  return (
    <main className="portal portal-login">
      <div className="portal-login-card">
        <p className="portal-eyebrow">Student portal</p>
        <h1>Sign in to keep learning</h1>
        <p className="portal-login-sub">
          Use the Google or Microsoft account you enrolled with.
        </p>

        {error && (
          <p className="portal-alert" role="alert">
            {error}
          </p>
        )}

        {offline && (
          <p className="portal-alert" role="alert">
            We could not reach the academy. Check your connection and try again.
          </p>
        )}

        {!offline && providers.length === 0 && (
          <div className="portal-soon" role="status">
            <p className="portal-soon-title">Coming soon</p>
            <p>
              Student sign-in is not switched on yet. Your classes carry on as
              normal in the meantime.
            </p>
          </div>
        )}

        {providers.map((p) => (
          <a
            key={p}
            className="portal-provider"
            href={`/auth/${p}/start?next=${encodeURIComponent(next)}`}
          >
            <ProviderMark name={p} />
            <span>Sign in with {PROVIDER_LABEL[p] || p}</span>
          </a>
        ))}

        <p className="portal-login-foot">
          Not a student yet? <Link to="/">See our courses</Link>
        </p>
      </div>
    </main>
  );
}

export default PortalLogin;

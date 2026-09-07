import PropTypes from "prop-types";
import { Navigate, useLocation } from "react-router-dom";
import { usePortalSession } from "./usePortalSession";
import PortalSkeleton from "./PortalSkeleton";
import "./Portal.css";

/**
 * Guards everything under /portal (#110).
 *
 * Renders a skeleton rather than a spinner while /auth/me is in flight, and
 * treats a failed request as "offline", not as "signed out" — bouncing a
 * student to a login screen they cannot reach the network to complete would be
 * the worst possible answer on a metered connection.
 */
function PortalRoute({ children }) {
  const { status, user, reload, logout } = usePortalSession();
  const location = useLocation();

  if (status === "loading") return <PortalSkeleton />;

  if (status === "offline") {
    return (
      <main className="portal portal-state">
        <div className="portal-state-card" role="status">
          <h1>You are offline</h1>
          <p>We could not reach the academy. Your connection may have dropped.</p>
          <button type="button" className="portal-btn" onClick={reload}>
            Try again
          </button>
        </div>
      </main>
    );
  }

  // Nothing to sign in to yet — send them to the login screen, which is where
  // the "coming soon" copy lives, rather than looping them through a guard.
  if (status === "anonymous" || status === "unconfigured") {
    // `state` carries where they were headed, so signing in returns them there
    // rather than dumping everyone on the home screen.
    return <Navigate to="/portal/login" replace state={{ from: location.pathname }} />;
  }

  return typeof children === "function" ? children({ user, logout }) : children;
}

PortalRoute.propTypes = { children: PropTypes.oneOfType([PropTypes.node, PropTypes.func]) };

export default PortalRoute;

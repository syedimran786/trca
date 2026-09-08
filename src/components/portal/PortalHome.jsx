import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";
import MenuBookRoundedIcon from "@mui/icons-material/MenuBookRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import CourseList from "./CourseList";
import { useCourses } from "./useCourses";
import "./Portal.css";

/**
 * /portal — the first screen a signed-in student sees (#111).
 *
 * The chrome is data-light on purpose: no photographs, no icon font, and
 * nothing that needs a second request to render. "My courses" is the one
 * section that fetches, and it paints its saved copy first (#137).
 */

function greeting(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

/**
 * The offline banner (#111).
 *
 * `navigator.onLine` is only ever trustworthy when it says *false*, so this is
 * used to show the banner and never to hide an error. The cached shell still
 * renders underneath — the ticket's requirement is a clear banner rather than
 * a blank page.
 */
function useOnline() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine !== false,
  );
  useEffect(() => {
    const up = () => setOnline(true);
    const down = () => setOnline(false);
    window.addEventListener("online", up);
    window.addEventListener("offline", down);
    return () => {
      window.removeEventListener("online", up);
      window.removeEventListener("offline", down);
    };
  }, []);
  return online;
}

function PortalHome({ user, logout }) {
  const online = useOnline();
  const { status, courses, cached, reload } = useCourses(user?.id);
  const firstName = String(user?.name || "").split(/\s+/)[0] || "there";

  return (
    <div className="portal portal-home">
      {!online && (
        <p className="portal-offline" role="status">
          You are offline. This is the last version we saved.
        </p>
      )}

      <header className="portal-top">
        <div>
          <p className="portal-eyebrow">{greeting()}</p>
          <h1>{firstName}</h1>
        </div>
        {/* Initials rather than the provider's avatar URL: one less request,
            and it renders identically with the network off. */}
        <span className="portal-avatar" aria-hidden="true">
          {(firstName[0] || "?").toUpperCase()}
        </span>
      </header>

      <section className="portal-section" aria-labelledby="next-class">
        <h2 id="next-class">Next class</h2>
        <div className="portal-card portal-card--quiet">
          <p className="portal-card-title">No class scheduled yet</p>
          <p className="portal-card-sub">
            Your batch timetable appears here once your course is assigned.
          </p>
        </div>
      </section>

      <section className="portal-section" aria-labelledby="my-courses">
        <h2 id="my-courses">My courses</h2>
        <CourseList status={status} courses={courses} cached={cached} reload={reload} />
      </section>

      <section className="portal-section" aria-labelledby="account">
        <h2 id="account">Account</h2>
        <div className="portal-card">
          <p className="portal-card-title">{user?.name || "Student"}</p>
          {user?.email && <p className="portal-card-sub">{user.email}</p>}
          <button type="button" className="portal-btn portal-btn--ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </section>

      {/* App chrome sized for a phone. One item per destination that exists;
          the other two are marked as not yet available rather than being dead
          controls that do nothing when tapped. */}
      <nav className="portal-tabs" aria-label="Portal">
        <span className="portal-tab portal-tab--active" aria-current="page">
          <HomeRoundedIcon fontSize="small" />
          Home
        </span>
        <span className="portal-tab" aria-disabled="true">
          <MenuBookRoundedIcon fontSize="small" />
          Courses
        </span>
        <span className="portal-tab" aria-disabled="true">
          <PersonRoundedIcon fontSize="small" />
          Profile
        </span>
      </nav>
    </div>
  );
}

PortalHome.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    name: PropTypes.string,
    email: PropTypes.string,
  }),
  logout: PropTypes.func.isRequired,
};

export default PortalHome;

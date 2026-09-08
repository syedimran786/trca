import PropTypes from "prop-types";
import { Link } from "react-router-dom";
import "./Portal.css";

/**
 * The "My courses" section on /portal (#137).
 *
 * Text only. A course cover is a photograph on a metered connection, so the
 * list renders from the one request it already made and never blocks on an
 * image; the tile carries the title, a one-line summary and a lesson count.
 */
function CourseList({ status, courses, cached, reload }) {
  if (status === "loading") {
    return (
      <div className="portal-skeleton" aria-busy="true">
        <div className="sk sk-card" />
        <div className="sk sk-card" />
      </div>
    );
  }

  if (status === "offline" || status === "error") {
    return (
      <div className="portal-card portal-card--quiet" role="status">
        <p className="portal-card-title">
          {status === "offline" ? "You are offline" : "We could not load your courses"}
        </p>
        <p className="portal-card-sub">
          {status === "offline"
            ? "Your courses will appear here once you are back on a connection."
            : "This is on our side, not yours. Please try again in a moment."}
        </p>
        <button type="button" className="portal-btn portal-btn--ghost" onClick={reload}>
          Try again
        </button>
      </div>
    );
  }

  if (!courses.length) {
    // Not a dead end: a student with no enrolment is told where to go next.
    return (
      <div className="portal-card portal-card--quiet">
        <p className="portal-card-title">No courses yet</p>
        <p className="portal-card-sub">
          Once you enrol, your lessons and notes appear here. Browse what the academy runs on the{" "}
          <a href="/">main site</a>.
        </p>
      </div>
    );
  }

  return (
    <>
      {cached && (
        <p className="portal-cached" role="status">
          Showing your saved copy.
        </p>
      )}
      <ul className="portal-list">
        {courses.map((c) => (
          <li key={c.id}>
            <Link className="portal-course" to={`/portal/courses/${c.slug}`}>
              <span className="portal-course-title">{c.title}</span>
              {c.summary && <span className="portal-course-sub">{c.summary}</span>}
              <span className="portal-course-meta">
                {c.lesson_count === 1 ? "1 lesson" : `${c.lesson_count || 0} lessons`}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

CourseList.propTypes = {
  status: PropTypes.string.isRequired,
  courses: PropTypes.array.isRequired,
  cached: PropTypes.bool,
  reload: PropTypes.func.isRequired,
};

export default CourseList;

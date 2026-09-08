import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PortalSkeleton from "./PortalSkeleton";
import { formatDuration } from "./coursesCache";
import "./Portal.css";

/**
 * /portal/courses/:slug — one course and its lessons (#137).
 *
 * Notes are the readable half of a lesson and cost a few kilobytes; video is
 * the expensive half and is not this ticket. Each lesson expands in place
 * rather than pushing the student to a per-lesson route, so reading a course
 * end to end on a phone is one screen and no further requests.
 */
function PortalCourse() {
  const { slug } = useParams();
  const [state, setState] = useState({ status: "loading", course: null });
  const [openId, setOpenId] = useState(null);

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(`/api/portal/courses/${encodeURIComponent(slug)}`, {
          credentials: "same-origin",
        });
        if (!live) return;
        if (res.status === 404) return setState({ status: "not_found", course: null });
        if (!res.ok) return setState({ status: "error", course: null });
        const body = await res.json().catch(() => ({}));
        setState({ status: "ready", course: body.course || null });
      } catch {
        // Not cached: a course body is large and a student reads it once. The
        // list on /portal is what has to survive offline, not every lesson.
        if (live) setState({ status: "offline", course: null });
      }
    })();
    return () => {
      live = false;
    };
  }, [slug]);

  if (state.status === "loading") return <PortalSkeleton />;

  if (state.status !== "ready" || !state.course) {
    const copy = {
      // 404 is also the answer for a course this student is not enrolled in,
      // so the wording covers both without guessing which it was.
      not_found: ["Course not found", "This course does not exist, or you are not enrolled in it."],
      offline: ["You are offline", "Open this course again once you have a connection."],
      error: ["We could not load this course", "This is on our side. Please try again shortly."],
    }[state.status] || ["Something went wrong", "Please try again."];

    return (
      <main className="portal portal-state">
        <div className="portal-state-card" role="status">
          <h1>{copy[0]}</h1>
          <p>{copy[1]}</p>
          <Link className="portal-btn" to="/portal">
            Back to my courses
          </Link>
        </div>
      </main>
    );
  }

  const { course } = state;
  const lessons = course.lessons || [];

  return (
    <main className="portal portal-course-page">
      <Link className="portal-back" to="/portal">
        <ArrowBackRoundedIcon fontSize="small" />
        My courses
      </Link>

      <header className="portal-top">
        <div>
          <p className="portal-eyebrow">Course</p>
          <h1>{course.title}</h1>
        </div>
      </header>
      {course.summary && <p className="portal-course-summary">{course.summary}</p>}

      <section className="portal-section" aria-labelledby="lessons">
        <h2 id="lessons">{lessons.length === 1 ? "1 lesson" : `${lessons.length} lessons`}</h2>

        {!lessons.length && (
          <div className="portal-card portal-card--quiet">
            <p className="portal-card-title">No lessons published yet</p>
            <p className="portal-card-sub">Your trainer adds them as the batch progresses.</p>
          </div>
        )}

        <ol className="portal-lessons">
          {lessons.map((l) => {
            const open = openId === l.id;
            return (
              <li key={l.id} className="portal-lesson">
                <button
                  type="button"
                  className="portal-lesson-head"
                  aria-expanded={open}
                  onClick={() => setOpenId(open ? null : l.id)}
                >
                  <span className="portal-lesson-no" aria-hidden="true">
                    {l.position}
                  </span>
                  <span className="portal-lesson-title">{l.title}</span>
                  <span className="portal-lesson-meta">{formatDuration(l.duration_seconds)}</span>
                </button>
                {open && (
                  <div className="portal-lesson-body">
                    {l.notes ? (
                      <p className="portal-lesson-notes">{l.notes}</p>
                    ) : (
                      <p className="portal-card-sub">No notes for this lesson yet.</p>
                    )}
                    {/* Video is deliberately absent until the storage decision
                        on #43 is made. A dead play button would be worse than
                        an honest line of text. */}
                    <p className="portal-card-sub">Video for this lesson is coming soon.</p>
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}

export default PortalCourse;

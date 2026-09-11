import { useCallback, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { Link, useParams } from "react-router-dom";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PortalSkeleton from "./PortalSkeleton";
import LessonMedia from "./LessonMedia";
import { formatDuration } from "./coursesCache";
import { formatBytes } from "./lessonPlayback";
import {
  courseUsage,
  readCourseCopy,
  readDownloads,
  removeCourseCopy,
  removeDownload,
  saveCourseCopy,
} from "./lessonDownloads";
import { canSaveLessons, lessonFiles } from "./offlineFiles";
import "./Portal.css";
import { apiCredentials, apiUrl } from "../../lib/apiBase";

/**
 * /portal/courses/:slug — one course and its lessons (#137).
 *
 * Notes are the readable half of a lesson and cost a few kilobytes; video is
 * the expensive half, and loads only when the student taps it (#188). Each
 * lesson expands in place
 * rather than pushing the student to a per-lesson route, so reading a course
 * end to end on a phone is one screen and no further requests.
 *
 * In the app, a lesson can be saved to the phone (#189). While any lesson of a
 * course is saved, a copy of the course is kept too, so this page opens from it
 * with no connection and the saved lessons play.
 */
function PortalCourse({ user }) {
  const { slug } = useParams();
  const userId = user?.id;
  const [state, setState] = useState({ status: "loading", course: null, saved: false });
  const [openId, setOpenId] = useState(null);
  // Bumped whenever a saved lesson changes, so the storage line re-reads
  const [version, setVersion] = useState(0);
  const [busy, setBusy] = useState(() => new Set()); // lessons saving right now

  useEffect(() => {
    let live = true;
    (async () => {
      try {
        const res = await fetch(apiUrl(`/api/portal/courses/${encodeURIComponent(slug)}`), {
          credentials: apiCredentials(),
        });
        if (!live) return;
        if (res.status === 404) return setState({ status: "not_found", course: null, saved: false });
        if (!res.ok) return setState({ status: "error", course: null, saved: false });
        const body = await res.json().catch(() => ({}));
        const course = body.course || null;
        // A course with saved lessons keeps its copy current: new lessons and
        // edited notes reach the phone the next time it is online
        if (course && readCourseCopy(userId, slug)) saveCourseCopy(userId, course);
        setState({ status: "ready", course, saved: false });
      } catch {
        // Only a course with a lesson saved on this phone is kept (#189). A
        // course body is large and most are read once, online.
        const copy = readCourseCopy(userId, slug);
        if (!live) return;
        setState(
          copy
            ? { status: "ready", course: copy.course, saved: true }
            : { status: "offline", course: null, saved: false },
        );
      }
    })();
    return () => {
      live = false;
    };
  }, [slug, userId]);

  const changed = useCallback(() => setVersion((v) => v + 1), []);
  const markBusy = useCallback((lessonId, saving) => {
    setBusy((prev) => {
      const next = new Set(prev);
      if (saving) next.add(lessonId);
      else next.delete(lessonId);
      return next;
    });
  }, []);

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
  // `version` is read so this recomputes after a save or delete
  const usage = canSaveLessons() && version >= 0 ? courseUsage(readDownloads(userId), course.slug) : { lessons: 0 };

  // Frees the space every saved lesson of this course takes
  const deleteAll = async () => {
    for (const entry of Object.values(readDownloads(userId))) {
      if (entry.slug !== course.slug) continue;
      await lessonFiles.remove(entry.path);
      removeDownload(userId, entry.lessonId);
    }
    removeCourseCopy(userId, course.slug);
    changed();
  };

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
      {state.saved && (
        <p className="portal-cached" role="status">
          You are offline. Showing your saved copy: saved lessons play, the others need a connection.
        </p>
      )}
      {course.summary && <p className="portal-course-summary">{course.summary}</p>}

      {usage.lessons > 0 && (
        <div className="portal-saved-usage">
          <p>
            On this phone: {formatBytes(usage.bytes) || "under 1 MB"} ·{" "}
            {usage.lessons === 1 ? "1 lesson" : `${usage.lessons} lessons`}
          </p>
          {/* Held while a lesson is saving, so a running download cannot
              write into a file that has just been deleted */}
          <button type="button" className="portal-save-btn portal-save-btn--quiet" onClick={deleteAll} disabled={busy.size > 0}>
            Delete all
          </button>
        </div>
      )}

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
                    {/* A lesson without video yet says so, rather than showing
                        a play button that goes nowhere. */}
                    {l.video_url ? (
                      <LessonMedia
                        lesson={l}
                        userId={userId}
                        course={course}
                        version={version}
                        onChange={changed}
                        onBusy={markBusy}
                      />
                    ) : (
                      <p className="portal-card-sub">Video for this lesson is coming soon.</p>
                    )}
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

PortalCourse.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  }),
};

export default PortalCourse;

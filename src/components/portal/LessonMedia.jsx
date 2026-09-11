import { useCallback, useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { apiCredentials, apiOrigin } from "../../lib/apiBase";
import LessonVideo from "./LessonVideo";
import { estimateBytes, formatBytes, videoSource } from "./lessonPlayback";
import {
  downloadFor,
  downloadLesson,
  lessonFilePath,
  progressPercent,
  readDownloads,
  removeCourseCopy,
  removeDownload,
  saveCourseCopy,
  writeDownload,
} from "./lessonDownloads";
import { canSaveLessons, lessonFiles } from "./offlineFiles";

const isOffline = () => typeof navigator !== "undefined" && navigator.onLine === false;

/**
 * A lesson's video, and in the app a way to save it to the phone (#189).
 *
 * On the website this is only the player: saving is an app feature.
 */
function LessonMedia(props) {
  if (!canSaveLessons()) return <LessonVideo lesson={props.lesson} userId={props.userId} />;
  return <SavableLesson {...props} />;
}

/**
 * Save for offline, with progress, stop, resume and delete.
 *
 * A dropped connection keeps what was saved, and saving carries on by itself
 * when the connection comes back while the page is open. A saved lesson plays
 * from the phone, connection or not.
 */
function SavableLesson({ lesson, userId, course, version, onChange, onBusy }) {
  const path = lessonFilePath(userId, lesson.id);
  const [entry, setEntry] = useState(() => downloadFor(readDownloads(userId), lesson.id));
  const [progress, setProgress] = useState(null); // { bytes, total } while saving
  const [problem, setProblem] = useState(null); // null | "offline" | "failed" | "space"
  const [offlineSrc, setOfflineSrc] = useState(null);
  const abort = useRef(null);
  const job = useRef(null);
  const resumeWhenOnline = useRef(false);
  const running = progress !== null;

  // Another control on the page (Delete all) may have changed what is saved
  useEffect(() => {
    setEntry(downloadFor(readDownloads(userId), lesson.id));
  }, [version, userId, lesson.id]);

  // A whole lesson plays from the phone
  const done = Boolean(entry && entry.done);
  useEffect(() => {
    let live = true;
    if (!done) {
      setOfflineSrc(null);
      return undefined;
    }
    lessonFiles
      .playableUrl(path)
      .then((url) => live && setOfflineSrc(url))
      .catch(() => live && setOfflineSrc(null));
    return () => {
      live = false;
    };
  }, [done, path]);

  // Leaving the page stops saving; what was saved stays for next time
  useEffect(() => () => abort.current?.abort(), []);

  const record = useCallback(
    (next) => {
      writeDownload(userId, next);
      setEntry(next);
      onChange?.();
    },
    [userId, onChange],
  );

  const save = useCallback(async () => {
    if (job.current) return;
    if (isOffline()) {
      setProblem("offline");
      resumeWhenOnline.current = true;
      return;
    }
    const controller = new AbortController();
    abort.current = controller;
    resumeWhenOnline.current = false;
    setProblem(null);
    onBusy?.(lesson.id, true);

    // The course page has to open offline for a saved lesson to be reachable
    saveCourseCopy(userId, course);
    const saved = downloadFor(readDownloads(userId), lesson.id);
    const base = {
      lessonId: lesson.id,
      slug: course.slug,
      path,
      bytes: saved?.bytes || 0,
      total: saved?.total ?? lesson.size_bytes ?? null,
      done: false,
    };
    record(base);
    setProgress({ bytes: base.bytes, total: base.total });

    const origin = apiOrigin();
    const url = videoSource(lesson.video_url, origin);
    let total = base.total;

    job.current = (async () => {
      try {
        const result = await downloadLesson({
          url,
          path,
          files: lessonFiles,
          signal: controller.signal,
          // The session cookie goes to the portal API only, as LessonVideo does
          credentials: origin && url.startsWith(origin) ? apiCredentials() : "omit",
          onProgress: (p) => {
            if (p.total) total = p.total;
            setProgress({ bytes: p.bytes, total });
            writeDownload(userId, { ...base, bytes: p.bytes, total });
          },
        });
        record({ ...base, bytes: result.bytes, total: result.total, done: true });
      } catch (err) {
        record({ ...base, bytes: await lessonFiles.size(path), total });
        if (controller.signal.aborted) return; // Stop or Delete: not a problem
        const dropped = isOffline() || err?.name === "TypeError" || err?.reason === "short";
        const full = /quota|space|ENOSPC/i.test(String(err?.message));
        setProblem(dropped ? "offline" : full ? "space" : "failed");
        resumeWhenOnline.current = dropped;
      } finally {
        if (abort.current === controller) abort.current = null;
        job.current = null;
        setProgress(null);
        onBusy?.(lesson.id, false);
      }
    })();
    await job.current;
  }, [course, lesson.id, lesson.size_bytes, lesson.video_url, onBusy, path, record, userId]);

  // Back online: carry on from where the drop left it
  useEffect(() => {
    const onOnline = () => {
      if (resumeWhenOnline.current) save();
    };
    window.addEventListener("online", onOnline);
    return () => window.removeEventListener("online", onOnline);
  }, [save]);

  const stop = () => {
    resumeWhenOnline.current = false;
    abort.current?.abort();
  };

  const remove = async () => {
    resumeWhenOnline.current = false;
    abort.current?.abort();
    // Let the stopped download write its last piece before the file goes, so
    // nothing is left behind
    await job.current?.catch(() => {});
    await lessonFiles.remove(path);
    const left = removeDownload(userId, lesson.id);
    if (!Object.values(left).some((e) => e.slug === course.slug)) removeCourseCopy(userId, course.slug);
    setEntry(null);
    setProblem(null);
    onChange?.();
  };

  const total = progress?.total ?? entry?.total ?? lesson.size_bytes ?? null;
  const sizeLabel = total
    ? formatBytes(total)
    : formatBytes(estimateBytes(lesson.duration_seconds)) && `about ${formatBytes(estimateBytes(lesson.duration_seconds))}`;

  let status;
  if (running) {
    const pct = progressPercent(progress.bytes, total);
    status = (
      <>
        <progress className="portal-save-bar" max={100} value={pct ?? undefined} aria-label="Saving lesson" />
        <p className="portal-save-status">
          {pct != null
            ? `Saving ${pct}% · ${formatBytes(progress.bytes) || "0 MB"} of ${formatBytes(total)}`
            : `Saving · ${formatBytes(progress.bytes) || "starting"}`}
        </p>
        <button type="button" className="portal-save-btn" onClick={stop}>
          Stop
        </button>
      </>
    );
  } else if (entry && entry.done) {
    status = (
      <>
        <p className="portal-save-status">Saved on this phone · {formatBytes(entry.bytes) || "under 1 MB"}</p>
        <button type="button" className="portal-save-btn portal-save-btn--quiet" onClick={remove}>
          Delete
        </button>
      </>
    );
  } else if (entry) {
    const pct = progressPercent(entry.bytes, total);
    status = (
      <>
        <p className="portal-save-status">
          {pct != null ? `Saved ${pct}% so far` : `Saved ${formatBytes(entry.bytes) || "under 1 MB"} so far`}
        </p>
        <button type="button" className="portal-save-btn" onClick={save}>
          Resume saving
        </button>
        <button type="button" className="portal-save-btn portal-save-btn--quiet" onClick={remove}>
          Delete
        </button>
      </>
    );
  } else {
    status = (
      <button type="button" className="portal-save-btn" onClick={save}>
        <DownloadRoundedIcon fontSize="small" aria-hidden="true" />
        {sizeLabel ? `Save for offline · ${sizeLabel}` : "Save for offline"}
      </button>
    );
  }

  return (
    <>
      <LessonVideo lesson={lesson} userId={userId} offlineSrc={offlineSrc} />
      <div className="portal-save" aria-live="polite">
        {status}
        {problem === "offline" && (
          <p className="portal-video-note portal-video-note--problem" role="status">
            No connection. Saving carries on from where it stopped once you are back online.
          </p>
        )}
        {problem === "space" && (
          <p className="portal-video-note portal-video-note--problem" role="status">
            Your phone is out of space. Delete a saved lesson and try again.
          </p>
        )}
        {problem === "failed" && (
          <p className="portal-video-note portal-video-note--problem" role="status">
            This lesson could not be saved. Tap to try again.
          </p>
        )}
      </div>
    </>
  );
}

const lessonShape = PropTypes.shape({
  id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  video_url: PropTypes.string,
  duration_seconds: PropTypes.number,
  size_bytes: PropTypes.number,
}).isRequired;

const mediaProps = {
  lesson: lessonShape,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  course: PropTypes.shape({ slug: PropTypes.string.isRequired }).isRequired,
  version: PropTypes.number, // bumped by the course page when saved lessons change
  onChange: PropTypes.func, // called when this lesson's saved state changes
  onBusy: PropTypes.func, // (lessonId, saving) so the page can hold Delete all
};

LessonMedia.propTypes = mediaProps;
SavableLesson.propTypes = mediaProps;

export default LessonMedia;

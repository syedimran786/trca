import { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import PlayArrowRoundedIcon from "@mui/icons-material/PlayArrowRounded";
import { apiCredentials, apiOrigin } from "../../lib/apiBase";
import { formatDuration } from "./coursesCache";
import {
  estimateBytes,
  formatBytes,
  formatClock,
  onMeteredConnection,
  readPosition,
  savePosition,
  videoSource,
} from "./lessonPlayback";

// How often, while playing, the position is saved. Often enough that a
// dropped connection or a closed app loses little; rarely enough to be free.
const SAVE_EVERY_SECONDS = 5;

/**
 * A lesson's video (#188).
 *
 * Nothing is fetched until the student taps: before then there is no <video>
 * element at all, so no browser or WebView can preload a byte on a metered
 * connection. The button says how big the lesson is first, and plays from
 * where the student stopped last time.
 *
 * `offlineSrc` is a lesson saved on the phone (#189): it plays from there,
 * with or without a connection, and costs no data.
 */
function LessonVideo({ lesson, userId, offlineSrc }) {
  const [source, setSource] = useState(null); // what is playing; null before the tap
  const [problem, setProblem] = useState(null); // null | "offline" | "failed"
  const [resumeAt, setResumeAt] = useState(() => readPosition(userId, lesson.id));
  const videoRef = useRef(null);
  const lastSaved = useRef(0);
  const started = source !== null;

  const origin = apiOrigin();
  // Inside the app the API is cross-origin, so the session cookie only travels
  // with a credentialed request, as every other portal call does. A saved copy
  // is on the phone and needs none.
  const credentialed =
    started && !source.offline && apiCredentials() === "include" && origin !== "" && source.url.startsWith(origin);

  // Leaving the page mid-lesson still saves where the student got to
  useEffect(() => {
    const video = videoRef.current;
    return () => {
      if (video && video.currentTime) savePosition(userId, lesson.id, video.currentTime, video.duration);
    };
  }, [started, userId, lesson.id]);

  const save = (video) => {
    savePosition(userId, lesson.id, video.currentTime, video.duration);
    lastSaved.current = video.currentTime;
  };

  const start = () => {
    if (!offlineSrc && typeof navigator !== "undefined" && navigator.onLine === false) {
      setProblem("offline");
      return;
    }
    setProblem(null);
    // Fixed at the tap, so a download finishing mid-lesson does not restart it
    setSource(offlineSrc ? { url: offlineSrc, offline: true } : { url: videoSource(lesson.video_url, origin), offline: false });
  };

  if (!started) {
    const duration = formatDuration(lesson.duration_seconds);
    // The API's size when it gives one; otherwise an estimate for the 360p copy
    const size = offlineSrc
      ? "saved on this phone"
      : lesson.size_bytes
        ? formatBytes(lesson.size_bytes)
        : formatBytes(estimateBytes(lesson.duration_seconds)) && `about ${formatBytes(estimateBytes(lesson.duration_seconds))}`;
    const meta = [duration !== "—" ? duration : "", size].filter(Boolean).join(" · ");

    return (
      <div className="portal-video portal-video--idle">
        <button type="button" className="portal-video-start" onClick={start}>
          <PlayArrowRoundedIcon fontSize="small" aria-hidden="true" />
          {resumeAt > 0 ? `Resume from ${formatClock(resumeAt)}` : "Play lesson"}
        </button>
        {meta && <p className="portal-video-meta">{meta}</p>}
        {!offlineSrc && onMeteredConnection() && (
          <p className="portal-video-note">You are on a slow or metered connection. Nothing downloads until you tap.</p>
        )}
        {problem === "offline" && (
          <p className="portal-video-note portal-video-note--problem" role="status">
            You are offline. Play this lesson again once you have a connection.
          </p>
        )}
        {problem === "failed" && (
          <p className="portal-video-note portal-video-note--problem" role="status">
            This video could not be loaded. Check your connection and tap to try again.
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="portal-video">
      <video
        ref={videoRef}
        className="portal-video-player"
        src={source.url}
        crossOrigin={credentialed ? "use-credentials" : undefined}
        controls
        autoPlay
        playsInline
        preload="metadata"
        onLoadedMetadata={(e) => {
          const video = e.currentTarget;
          if (resumeAt > 0 && (!video.duration || resumeAt < video.duration)) video.currentTime = resumeAt;
        }}
        onTimeUpdate={(e) => {
          const video = e.currentTarget;
          if (Math.abs(video.currentTime - lastSaved.current) >= SAVE_EVERY_SECONDS) save(video);
        }}
        onPause={(e) => save(e.currentTarget)}
        onEnded={(e) => {
          save(e.currentTarget); // at the end, this clears the saved place
          setResumeAt(0);
        }}
        onError={() => {
          // Back to the button, with a way to try again, rather than a dead player
          const offline = !source.offline && typeof navigator !== "undefined" && navigator.onLine === false;
          setResumeAt(readPosition(userId, lesson.id));
          setSource(null);
          setProblem(offline ? "offline" : "failed");
        }}
      />
    </div>
  );
}

LessonVideo.propTypes = {
  lesson: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    video_url: PropTypes.string,
    duration_seconds: PropTypes.number,
    size_bytes: PropTypes.number, // not sent yet; the size is estimated until #187 adds it
  }).isRequired,
  userId: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  offlineSrc: PropTypes.string, // a copy saved on the phone (#189)
};

export default LessonVideo;

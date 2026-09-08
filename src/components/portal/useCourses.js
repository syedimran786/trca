import { useCallback, useEffect, useState } from "react";
import { readCache, writeCache } from "./coursesCache";

/**
 * The student's course list, from GET /api/portal/courses (#137).
 *
 * Mirrors usePortalSession's shape: `status` is the whole state machine, and a
 * failed request is "offline", never "you have no courses".
 *   loading | ready | offline | error
 *
 * `cached` is true when what is on screen came from the saved copy rather than
 * the network, so the screen can say so instead of quietly showing old data.
 */
export function useCourses(userId) {
  const [status, setStatus] = useState("loading");
  const [courses, setCourses] = useState([]);
  const [cached, setCached] = useState(false);

  const load = useCallback(async () => {
    // Paint the saved copy first. On a slow connection this is the difference
    // between a blank screen for eight seconds and a usable one immediately.
    const saved = readCache(userId);
    if (saved) {
      setCourses(saved.courses);
      setCached(true);
      setStatus("ready");
    } else {
      setStatus("loading");
    }

    try {
      const res = await fetch("/api/portal/courses", { credentials: "same-origin" });
      if (!res.ok) {
        // 503 means the academy's side is down. If a saved copy is already on
        // screen it stays there; there is nothing better to show.
        if (!saved) setStatus("error");
        return;
      }
      const body = await res.json().catch(() => ({}));
      const list = Array.isArray(body.courses) ? body.courses : [];
      setCourses(list);
      setCached(false);
      setStatus("ready");
      writeCache(userId, list);
    } catch {
      if (!saved) setStatus("offline");
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  return { status, courses, cached, reload: load };
}

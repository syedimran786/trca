/**
 * Read placements from D1, falling back to the bundled array (#145).
 *
 * Everything the site shows used to live in placement.js, so a new placement
 * needed a commit, a PR and a deploy — which is why Instagram has many more
 * placements than the site does. Now /admin/placements writes to D1 and this
 * reads it.
 *
 * Fails soft on purpose. If the fetch errors, or returns nothing, the bundled
 * array renders instead: an empty placements section is a worse outcome than a
 * stale one, and this is the section that does most of the persuading.
 */
import { useEffect, useState } from "react";
import { placements as bundled, resolveAsset } from "./placement";

/** Turn the API's asset references into things <img src> can use. */
function hydrate(record) {
  const out = { ...record };
  if (out.photo_url) out.image = resolveAsset(out.photo_url);
  if (out.company?.logo) out.company = { ...out.company, logo: resolveAsset(out.company.logo) };
  return out;
}

export default function usePlacements() {
  const [state, setState] = useState({ placements: bundled, loading: true });

  useEffect(() => {
    let live = true;
    const controller = new AbortController();
    // Nothing on this page is worth blocking on. If the endpoint is slow the
    // bundled list is already rendered and stays.
    const timer = setTimeout(() => controller.abort(), 5000);

    fetch("/api/placements/list", { signal: controller.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!live) return;
        const rows = data?.placements;
        setState({
          placements: Array.isArray(rows) && rows.length ? rows.map(hydrate) : bundled,
          loading: false,
        });
      })
      .catch(() => {
        if (live) setState({ placements: bundled, loading: false });
      })
      .finally(() => clearTimeout(timer));

    return () => {
      live = false;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);

  return state;
}

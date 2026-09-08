// GET /api/placements/list — published placements for the site (#145).
//
// Cached for 5 minutes at the edge. Placements do not need to be real-time —
// a new one appearing within five minutes of the admin hitting save is fine —
// and caching is what keeps a section rendered on every page view from turning
// into a D1 read on every page view.
//
// Fails soft: any error returns an empty list with a 200, because the site
// falls back to its bundled array when the list is empty. A 500 here would
// turn "placements are briefly stale" into "the most persuasive section on the
// site is a broken state".
import { rowToRecord } from "../../../shared/placements.js";

const CACHE = "public, max-age=300";

function json(body, status = 200, cache = "no-store") {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": cache },
  });
}

export async function onRequestGet(context) {
  const { env } = context;
  if (!env.DB) return json({ placements: [] }, 200, "no-store");

  try {
    const res = await env.DB.prepare(
      "SELECT id, name, designation, company_name, company_logo_url, photo_url, " +
        "description, background, journey, linkedin_url, course_slug, instagram_url " +
        "FROM placements WHERE is_published = 1 " +
        "ORDER BY display_order ASC, created_at DESC",
    ).all();
    const rows = res.results || [];
    return json({ placements: rows.map(rowToRecord) }, 200, CACHE);
  } catch {
    return json({ placements: [] }, 200, "no-store");
  }
}

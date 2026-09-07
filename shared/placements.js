/**
 * The placement record shape, shared by the API, the admin form and the site (#145).
 *
 * D1 rows are snake_case with 0/1 integers; the site's components were written
 * against a camelCase array with a nested `company` object. Rather than change
 * every consumer, the row is mapped to the shape they already read — so the
 * switch from the hardcoded array to D1 is invisible to a visitor and to most
 * of the component tree.
 */

/** Every column an admin can set. `id`, timestamps and publish state are not here. */
export const EDITABLE_FIELDS = [
  "name",
  "designation",
  "company_name",
  "company_logo_url",
  "photo_url",
  "description",
  "background",
  "journey",
  "linkedin_url",
  "course_slug",
  "instagram_url",
];

/**
 * A record needs *something* to render: either the traditional photo + company
 * card, or an Instagram embed that carries all of it visually. A row with a
 * name and nothing else would render an empty card, which is worse than not
 * rendering it — so it is rejected at the point of entry rather than filtered
 * out later, where nobody would understand why their placement vanished.
 */
export function validatePlacement(input) {
  const errors = [];
  const name = String(input.name || "").trim();
  if (!name) errors.push("Student name is required.");

  const hasEmbed = !!String(input.instagram_url || "").trim();
  const hasCard = !!String(input.designation || "").trim() && !!String(input.company_name || "").trim();
  if (!hasEmbed && !hasCard) {
    errors.push(
      "Give either an Instagram post URL, or both a designation and a company name — " +
        "otherwise the card has nothing to show.",
    );
  }

  for (const [field, value] of Object.entries(input)) {
    if (!field.endsWith("_url") || !value) continue;
    // `bundled:` is how the seeded records point at Vite asset imports whose
    // real URLs only exist after a build. Anything else must be a real URL.
    if (String(value).startsWith("bundled:")) continue;
    if (!/^(https?:\/\/|\/)/.test(String(value))) {
      errors.push(`${field} must be a full URL or start with "/".`);
    }
  }

  if (String(input.instagram_url || "") && !/^https:\/\/(www\.)?instagram\.com\//.test(String(input.instagram_url))) {
    errors.push("Instagram URL must be an instagram.com link.");
  }

  return errors;
}

/** D1 row → the shape the site components already read. */
export function rowToRecord(row) {
  const rec = { id: row.id, name: row.name };
  if (row.designation) rec.designation = row.designation;
  if (row.photo_url) rec.photo_url = row.photo_url;
  if (row.description) rec.description = row.description;
  if (row.background) rec.background = row.background;
  if (row.journey) rec.journey = row.journey;
  if (row.linkedin_url) rec.linkedin = row.linkedin_url;
  if (row.course_slug) rec.courseSlug = row.course_slug;
  if (row.instagram_url) rec.instagram_url = row.instagram_url;
  if (row.company_name) {
    rec.company = { name: row.company_name };
    if (row.company_logo_url) rec.company.logo = row.company_logo_url;
  }
  return rec;
}

/** Form/JSON input → the columns to write. Trims, and stores "" as NULL. */
export function inputToColumns(input) {
  const out = {};
  for (const field of EDITABLE_FIELDS) {
    const value = String(input[field] ?? "").trim();
    out[field] = value === "" ? null : value.slice(0, 4000);
  }
  return out;
}

import ashish from "../../../assets/placements/ashish.png"
import sakshi from "../../../assets/placements/sakshi.png"
import sujith from "../../../assets/placements/sujith.png"
import prajwala from "../../../assets/placements/prajwala.png"

// Company logos are bundled, never hotlinked (#10). Every one of these used to
// be a URL on someone else's server — a 2016 SAP blog attachment, an unrelated
// financial news site, two signed LinkedIn CDN links. Any of them could 404 or
// be swapped without warning, and this is the most persuasive section on the
// site to render as broken images.
import sapHybris from "../../../assets/clients/sap-hybris.webp"
import hcl from "../../../assets/clients/hcl.jpg"
import skad from "../../../assets/clients/skad.jpg"
import qsg from "../../../assets/clients/qsg.jpg"




// Placement records also act as case-study source. Optional fields (background,
// courseSlug, journey, linkedin) render extra sections and enrich the Person
// JSON-LD when set. Leave them out to render the compact card unchanged — never
// invent them, since a fabricated background is the exact kind of claim a
// visitor will call us on.
//
// Fields:
//   name          (required) student name as shown publicly
//   designation   (optional) role at the company — required for the traditional
//                 photo+name+company card; omitted for IG-embed-only records
//                 whose visual comes entirely from the embed
//   image         (optional) bundled photo import — same optionality reasoning
//                 as designation
//   company       (optional) { name, logo } — same again
//   description   (optional) student's own words / testimonial
//   background    (optional) one-line context ("BCA from Karnataka College…")
//   courseSlug    (optional) slug from courses.js — renders "Course" chip and
//                 links alumniOf to that specific course
//   journey       (optional) 1–3 sentences: where they started → what they did
//                 at RCA → what they do now. Used as `worksFor.description` in
//                 schema and rendered as a case-study paragraph in the card.
//   linkedin      (optional) full LinkedIn URL — surfaced as `sameAs` in schema
//                 and rendered as a "Verify on LinkedIn" link.
//   instagram_url (optional) direct URL to the placement post or Reel on
//                 @restcoderacademy. When set, `PlacementCard` renders IG's
//                 official embed as the primary content of the card in place
//                 of the photo+name+company layout — the embed carries the
//                 real caption, real like count and real IG branding, which
//                 is stronger social proof than a screenshot could ever be.
//                 Photo, designation and company become optional when this
//                 field is set (see Kota Akshay Rathna Kumar below). Fallback
//                 rendering when the embed fails to load is documented in
//                 `InstagramEmbed.jsx`. Wider scope (YouTube + LinkedIn URLs,
//                 admin CRUD) is queued as portal work in #145.
/**
 * The bundled images, keyed so a D1 row can point at one (#145).
 *
 * Records added through /admin/placements carry ordinary URLs. The four
 * original records cannot: their images are Vite asset imports whose real URLs
 * contain a content hash that only exists after a build, so the seed rows in
 * schema-placements.sql reference them as `bundled:<key>` and this map is what
 * resolves that back to the imported asset. It is why switching the site from
 * this array to D1 leaves those four pixel-identical.
 */
export const BUNDLED_ASSETS = {
  ashish, sakshi, sujith, prajwala,
  sapHybris, hcl, skad, qsg,
};

/** `bundled:hcl` → the imported asset; any other value passes through. */
export function resolveAsset(value) {
  if (typeof value !== "string") return value;
  if (!value.startsWith("bundled:")) return value;
  return BUNDLED_ASSETS[value.slice("bundled:".length)] || undefined;
}

/**
 * The fallback list.
 *
 * The site reads placements from /api/placements/list now (#145). This array
 * stays as what renders when that fetch fails — a network error, the function
 * down, D1 unreachable. Placements are the most persuasive section on the
 * site; an empty one is a worse failure than a slightly stale one.
 *
 * 2026-09-09 reconciliation: rewritten to the ten most recent placement
 * announcement Reels/Posts on @restcoderacademy, ordered newest first to
 * match the IG grid. The previous four testimonial-only records (Ashish,
 * Sakshi, Sujith, Prajwala) had no verifiable IG post and were retired here;
 * their photos remain bundled and resolvable via BUNDLED_ASSETS so a D1
 * row can still reference `bundled:ashish` etc. without a code change if
 * an old placement is restored through the admin portal. Kota Akshay's
 * record is preserved as the anchor of the new list.
 *
 * Every URL below was verified against @restcoderacademy's own grid on the
 * day this list was written; names, designations and one-line education
 * lines are lifted directly from each post's caption or in-reel overlay,
 * never invented — the "never fabricate" rule in the field docs above.
 * Company names are conspicuously absent from RCA's post captions
 * ("reputed company", "amazing package") so `company` stays unset.
 */
export let placements = [
    {
        name: "Manideepika",
        designation: "Software Engineer",
        background: "B.Tech Computer Science graduate",
        instagram_url: "https://www.instagram.com/reel/DdBgLQntnNb/",
    },
    {
        name: "Selvaraj Nandhini",
        designation: "Software Engineer",
        background: "Recent B.Tech graduate",
        instagram_url: "https://www.instagram.com/reel/Dc_A6hYteGI/",
    },
    {
        name: "Kota Akshay Rathna Kumar",
        background: "B.Tech CSE, 2026 graduate",
        instagram_url: "https://www.instagram.com/p/Dc5o-Uatcxz/",
    },
    {
        name: "Prateeksha",
        designation: "Software Developer",
        instagram_url: "https://www.instagram.com/reel/Dc0gG5xNvtI/",
    },
    {
        name: "Praveenkumar",
        background: "B.Tech IT, 2024 graduate",
        instagram_url: "https://www.instagram.com/reel/DcxX5ouNVy0/",
    },
    {
        name: "Dharati J M",
        designation: "Software Engineer Trainee",
        instagram_url: "https://www.instagram.com/reel/DcsNkJWNfCl/",
    },
    {
        name: "Uday Srinivas",
        instagram_url: "https://www.instagram.com/reel/DclQQ2QNHlj/",
    },
    {
        name: "Bayannaboina Jayasimha",
        designation: "Java Developer",
        instagram_url: "https://www.instagram.com/p/DclARHCtJPT/",
    },
    {
        name: "Shreenidhi A Goud",
        designation: "Software Engineer",
        instagram_url: "https://www.instagram.com/p/DcibeXsNfmP/",
    },
    {
        name: "Pritiprasanna Nayak",
        designation: "Graduate Engineer Trainee",
        instagram_url: "https://www.instagram.com/reel/DcIy0antGCX/",
    },
]
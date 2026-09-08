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
 */
export let placements=[
    {
        name:"Ashish Jadhav",
        designation:"SAP Hybris Developer",
        image:ashish,
        company:{name:"SAP Hybris", logo:sapHybris},
        background:"Non-IT background from Maharashtra; moved to Bengaluru to switch into engineering.",
        description:`Uday Sir is an exceptional mentor who transformed my career prospects. Despite being a non-IT background student from Maharashtra, I thrived under his guidance in Bangalore. His teaching style is concise, clear, and engaging. Uday Sir's patience and willingness to help are admirable. He creates a supportive environment, encouraging students to ask questions. His friendly nature makes complex concepts accessible and enjoyable.`
    },
    {
        name:"Sakshi",
        designation:"Software Engineer",
        image:sakshi,
        company:{name:"HCL Technologies", logo:hcl},
         description:`Uday Sir is an exceptional Java programming teacher, known for his deep knowledge and engaging teaching style. His ability to simplify complex concepts makes learning Java both easy and enjoyable. With a passion for coding and a dedication to his students' success, he ensures that everyone gains a strong foundation in programming. His guidance not only helps students master Java but also instills confidence in problem-solving and logical thinking.`
    },
    {
        name:"Sujith",
        designation:"Software Engineer",
        image:sujith,
        company:{name:"SKAD IT Solutions", logo:skad},
         description:`The coaching institute offers an exceptional Java and Python Full stack  course with comprehensive coverage of Core Java, Springs,Hibernate,SQL,Python,Django. Uday sir's expert guidance on backend development is complemented perfectly. His combined industry experience and personalized mentoring ensure students gain practical skills through hands-on projects. The institute maintains small batch sizes, creating an interactive learning environment.`

    },
    {
        name:"Prajwala R",
        designation:"Test Automation Engineer",
        image:prajwala,
        company:{name:"Quality Service Group", logo:qsg},
         description:`Uday sir is a fantastic Java trainer who breaks down complex topics into simple, easy-to-grasp concepts. He creates a supportive learning environment that encourages students to ask questions and grow. What sets him apart is his ability to adapt to different learning styles and pace.I'm grateful for his mentorship, which helped me achieve my goals. Finally thanks to all the team members of rest coder academy.`

    },
    // First IG-embed-only placement — proof-of-concept for the pattern
    // described in #145. Kota Akshay's placement was announced on
    // @restcoderacademy on 2026-09-06 (post ID Dc5o-Uatcxz). Photo, company
    // and testimonial aren't in `placement.js` yet — the embed carries all
    // of that visually. When the D1 + admin CRUD lands, this record migrates
    // as-is (the instagram_url field becomes an instagram_url column).
    {
        name: "Kota Akshay Rathna Kumar",
        background: "B.Tech CSE, 2026 graduate",
        instagram_url: "https://www.instagram.com/p/Dc5o-Uatcxz/",
    },

]
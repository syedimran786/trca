import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../App";
import usePlacements from "../organism/placements/usePlacements";
import InstagramEmbed from "../organism/placements/InstagramEmbed";
import "./PlacementsPage.css";

const ORIGIN = "https://restcoderacademy.in";
// Same @id as the EducationalOrganization node in index.html, so these
// reviews are read as reviews of that entity, not a disconnected one.
const ORG_ID = `${ORIGIN}/#org`;

function PlacementsPage() {
  const { openModal } = useAuth();
  // Reads D1 via /api/placements/list, falling back to the bundled array (#145).
  // The JSON-LD below is rebuilt from whatever this returns, so a placement
  // published in the admin form is structured-data-visible on the same render
  // as it is visible on the page — they cannot drift apart.
  const { placements } = usePlacements();
  const url = `${ORIGIN}/placements`;
  const description =
    "Real students, real companies, real roles. See where Rest Coder Academy graduates work — " +
    "SAP Hybris, HCL Technologies, SKAD IT Solutions and more.";

  // Structured data graph. Every entry here is derived from real, named
  // placements — from D1, or the bundled array — nothing is invented. Emits:
  //  - Review (existing) — reads as reviews of the org, not disconnected.
  //  - Person + alumniOf (new) — makes the alumni relationship explicit,
  //    which Google's SGE and AI answer engines pick up when asked
  //    "where do Rest Coder Academy graduates work". `sameAs` is added
  //    only when a placement carries a LinkedIn URL (verifiable).
  //  - ItemList (new) — declares this page as a curated list of alumni
  //    so search understands the shape.
  // No aggregateRating and no invented star scores: the placements data
  // has no rating field, so anything numeric would be fabricated and an
  // identical 5/5 on every review is exactly what Google's structured-
  // data spam checks flag.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      // Review entries need an actual reviewBody — a Person who was placed
      // but hasn't shared a written testimonial (yet) contributes to
      // ItemList + Person nodes only. Google flags Review with an empty
      // reviewBody as incomplete structured data.
      ...placements
        .filter((p) => p.description)
        .map((p) => ({
          "@type": "Review",
          itemReviewed: { "@id": ORG_ID },
          author: { "@type": "Person", name: p.name },
          reviewBody: p.description,
        })),
      ...placements.map((p) => ({
        "@type": "Person",
        name: p.name,
        jobTitle: p.designation,
        alumniOf: { "@id": ORG_ID },
        worksFor: p.company?.name
          ? {
              "@type": "Organization",
              name: p.company.name,
              ...(p.journey ? { description: p.journey } : {}),
            }
          : undefined,
        ...(p.linkedin ? { sameAs: [p.linkedin] } : {}),
      })),
      {
        "@type": "ItemList",
        name: "Rest Coder Academy — placed graduates",
        itemListElement: placements.map((p, i) => ({
          "@type": "ListItem",
          position: i + 1,
          item: { "@type": "Person", name: p.name, jobTitle: p.designation },
        })),
      },
    ],
  };

  return (
    <>
      <title>Student Placements — Real Outcomes | Rest Coder Academy</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="pl">
        <header className="pl-hero">
          <span className="pl-eyebrow">Success stories</span>
          <h1>Where our students ended up.</h1>
          <p>
            Not stock photos or vague promises — named students, the companies that hired them,
            and the roles they landed.
          </p>
          <div className="pl-cta">
            <button className="pl-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="pl-btn pl-btn--ghost" to="/">See our courses</Link>
          </div>
        </header>

        <section className="pl-list">
          {placements.map((p) => {
            // IG-embed-only variant: no photo / role / testimonial in
            // `placement.js` — the embed IS the case study. Render the
            // embed inside the same pl-card shell so it fits the section's
            // layout without a bespoke wrapper.
            if (p.instagram_url) {
              return (
                <article className="pl-card pl-card--instagram" key={p.name}>
                  <div className="pl-body pl-body--instagram">
                    <h2>{p.name}</h2>
                    {p.background && (
                      <p className="pl-background"><b>Background:</b> {p.background}</p>
                    )}
                    <InstagramEmbed url={p.instagram_url} alumnusName={p.name} />
                  </div>
                </article>
              );
            }
            return (
              <article className="pl-card" key={p.name}>
                <img className="pl-photo" src={p.image} alt={p.name} />
                <div className="pl-body">
                  <h2>{p.name}</h2>
                  <p className="pl-role">{p.designation} · {p.company?.name}</p>
                  {p.company?.logo && (
                    <img className="pl-logo" src={p.company.logo} alt={`${p.company.name} logo`} />
                  )}
                  {p.background && (
                    <p className="pl-background"><b>Background:</b> {p.background}</p>
                  )}
                  {p.journey && (
                    <p className="pl-journey"><b>Journey:</b> {p.journey}</p>
                  )}
                  <p className="pl-quote">&ldquo;{p.description}&rdquo;</p>
                  {p.linkedin && (
                    <a className="pl-verify" href={p.linkedin} target="_blank" rel="noopener noreferrer">
                      Verify on LinkedIn &rarr;
                    </a>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        <section className="pl-foot">
          <h2>Want an outcome like this?</h2>
          <p>Talk to a counsellor about the course, the fees and EMI, and the next batch.</p>
          <div className="pl-cta">
            <button className="pl-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="pl-btn pl-btn--ghost" to="/for-parents">For parents</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default PlacementsPage;

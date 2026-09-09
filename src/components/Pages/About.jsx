import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { Link } from "react-router-dom";
import { useAuth } from "../../App";
import { useFounder, hasFounder } from "./useFounder";
import "./About.css";

const ORIGIN = "https://restcoderacademy.in";

function initials(name) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}
function paragraphs(text) {
  // Normalise CRLF (admin textarea / pasted content) before splitting on blank
  // lines, so multi-paragraph fields render as separate <p>s, not one blob.
  return String(text || "").replace(/\r\n/g, "\n").split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

// Static fallback rendered when /api/founder returns nothing (admin hasn't set
// founder details yet) OR during prerender when the API isn't reachable.
// Previously we redirected /about to /, which made the URL a duplicate of the
// homepage and caused the site to look like it was serving one page under two
// URLs. Now /about always has real, unique content about the school itself.
function AboutFallback() {
  const { openModal } = useAuth();
  const url = `${ORIGIN}/about`;
  const description =
    "Rest Coder Academy is a live, project-based full-stack coding school in Jayanagar, Bengaluru. Java, Python, MERN and a Forward Deployed Engineering program — with placement support, EMI, and weekly progress reports parents can actually see.";
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "EducationalOrganization",
    "@id": `${ORIGIN}/#org`,
    name: "Rest Coder Academy",
    url: `${ORIGIN}/`,
    description,
    areaServed: "Bengaluru",
  };
  const title = "About Rest Coder Academy — Live Full-Stack Coding in Bengaluru";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="ab">
        <header className="ab-hero">
          <div className="ab-hero-text">
            <span className="ab-eyebrow">About the academy</span>
            <h1>Rest Coder Academy — coding classes that ship real work.</h1>
            <p>{description}</p>
          </div>
        </header>
        <section className="ab-block">
          <p>We run small, live cohorts — no recorded-video &ldquo;self-paced&rdquo; fillers. Every course is taught by a working engineer, keeps students accountable week-by-week, and ends with real projects, not slides. Guardians get honest weekly progress reports so nobody&rsquo;s flying blind.</p>
          <p>We are based in Jayanagar, Bengaluru, and serve students across the city. Placement support is real: our graduates are listed by name and company on our placements page — no vague promises.</p>
        </section>
        <section className="ab-signoff">
          <div className="ab-cta">
            <button className="ab-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="ab-btn ab-btn--ghost" to="/">See our courses</Link>
            <Link className="ab-btn ab-btn--ghost" to="/placements">See real placements</Link>
          </div>
        </section>
      </main>
    </>
  );
}

// The founder / About page is entirely admin-managed (/admin/founder → D1 →
// /api/founder). When a founder record is set, we render their story. When
// it isn't, we render a school-level about page — never a redirect to /,
// because that made /about a duplicate URL of the homepage.
function About() {
  const { openModal } = useAuth();
  const { founder, loaded } = useFounder();

  if (!loaded) return <AboutFallback />;
  if (!hasFounder(founder)) return <AboutFallback />;

  const { name, title, tagline, intro, story, mission, vision, photo_url, linkedin_url } = founder;
  const url = `${ORIGIN}/about`;
  const heading = String(tagline || "").trim() || `${name} — ${title || "Founder"} of Rest Coder Academy`;
  const description = String(intro || "").trim() || `${name}, ${title || "founder"} of Rest Coder Academy.`;
  const body = paragraphs(story);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name,
    jobTitle: title || "Founder, Rest Coder Academy",
    description,
    url,
    worksFor: { "@type": "EducationalOrganization", name: "Rest Coder Academy", sameAs: `${ORIGIN}/` },
    ...(linkedin_url ? { sameAs: [linkedin_url] } : {}),
  };

  // Not `title` — that name is already the founder's job title above.
  const pageTitle = `About ${name} — Rest Coder Academy`;

  return (
    <>
      <title>{pageTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={pageTitle} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="ab">
        <header className="ab-hero">
          <div className="ab-hero-text">
            <span className="ab-eyebrow">The founder</span>
            <h1>{heading}</h1>
            {intro && <p>{intro}</p>}
          </div>
          <div className="ab-photo">
            {photo_url ? (
              <img src={photo_url} alt={`${name}, founder of Rest Coder Academy`} />
            ) : (
              <span className="ab-avatar" aria-hidden="true">{initials(name)}</span>
            )}
            <span className="ab-photo-name">
              {name}
              <small>{title || "Founder"}</small>
            </span>
          </div>
        </header>

        {body.length > 0 && (
          <section className="ab-block">
            {body.map((p, i) => (
              <p key={i}>{p}</p>
            ))}
          </section>
        )}

        {(mission || vision) && (
          <div className="ab-values">
            {mission && (
              <div className="ab-value">
                <span className="ab-value-label">Mission</span>
                {paragraphs(mission).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
            {vision && (
              <div className="ab-value">
                <span className="ab-value-label">Vision</span>
                {paragraphs(vision).map((p, i) => <p key={i}>{p}</p>)}
              </div>
            )}
          </div>
        )}

        <section className="ab-signoff">
          <span className="ab-sign">— {name}, {title || "Founder"}</span>
          <div className="ab-cta">
            <button className="ab-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="ab-btn ab-btn--ghost" to="/">See our courses</Link>
            {linkedin_url && (
              <a className="ab-btn ab-btn--ghost" href={linkedin_url} target="_blank" rel="noopener noreferrer">LinkedIn</a>
            )}
          </div>
        </section>
      </main>
    </>
  );
}

export default About;

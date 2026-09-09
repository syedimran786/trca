import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { Link } from "react-router-dom";
import { useAuth } from "../../App";
import "./Contact.css";

const ORIGIN = "https://restcoderacademy.in";
const MAP_URL = "https://maps.app.goo.gl/XdZWt3oDzGUCL5KWA?g_st=iw";

// Same NAP as the footer (FooterAddress.jsx / FooterLocation.jsx) — kept in
// sync by hand since there's no shared data source for it yet.
const ADDRESS = {
  street: "#364, 3rd Floor, 16th Main, 4th T Block East, Pattabhirama Nagar, Jayanagar",
  locality: "Bengaluru",
  region: "Karnataka",
  postalCode: "560041",
  country: "IN",
};
const PHONE_DISPLAY = "+91 80737 62257";
const PHONE_TEL = "+918073762257";
// The old enquiry@restcoderacademy.com address hard-bounces (.com is expired
// at GoDaddy per README; the .in domain has no MX). Until we set up mail on
// restcoderacademy.in, use the working Gmail address. Everyone who copies
// this from the site actually reaches an inbox we check.
const EMAIL = "restcoderacademy@gmail.com";

function Contact() {
  const { openModal } = useAuth();
  const url = `${ORIGIN}/contact`;
  const fullAddress = `${ADDRESS.street}, ${ADDRESS.locality}, ${ADDRESS.region} ${ADDRESS.postalCode}`;
  const description =
    `Visit or call Rest Coder Academy in Jayanagar, Bengaluru — ${fullAddress}. ` +
    `Phone ${PHONE_DISPLAY}, or reach us at ${EMAIL}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    // Same @id as the EducationalOrganization node in index.html, so this is
    // read as the same entity (with address/contact detail) rather than a
    // second, competing business on the same domain.
    "@id": `${ORIGIN}/#org`,
    name: "Rest Coder Academy",
    image: `${ORIGIN}/favicon.png`,
    url: ORIGIN,
    telephone: PHONE_TEL,
    email: EMAIL,
    address: {
      "@type": "PostalAddress",
      streetAddress: ADDRESS.street,
      addressLocality: ADDRESS.locality,
      addressRegion: ADDRESS.region,
      postalCode: ADDRESS.postalCode,
      addressCountry: ADDRESS.country,
    },
    hasMap: MAP_URL,
  };

  const title = "Contact Us — Rest Coder Academy, Jayanagar, Bengaluru";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="ct">
        <header className="ct-hero">
          <span className="ct-eyebrow">Contact &amp; location</span>
          <h1>Visit us in Jayanagar, or just call.</h1>
          <p>
            Offline classes, one campus, no call centre in between. If you'd rather talk first,
            a counsellor can walk you through courses, fees and the next batch.
          </p>
          <div className="ct-cta">
            <button className="ct-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="ct-btn ct-btn--ghost" to="/">See our courses</Link>
          </div>
        </header>

        <section className="ct-details">
          <div className="ct-card">
            <h2>Address</h2>
            <p>
              {ADDRESS.street}
              <br />
              {ADDRESS.locality}, {ADDRESS.region} {ADDRESS.postalCode}
            </p>
            <a className="ct-map-link" href={MAP_URL} target="_blank" rel="noreferrer">
              Get directions →
            </a>
          </div>

          <div className="ct-card">
            <h2>Phone</h2>
            <p>
              <a className="ct-link" href={`tel:${PHONE_TEL}`}>{PHONE_DISPLAY}</a>
            </p>
            <h2>Email</h2>
            <p>
              <a className="ct-link" href={`mailto:${EMAIL}`}>{EMAIL}</a>
            </p>
          </div>
        </section>

        <section className="ct-map">
          <a className="ct-map-cta" href={MAP_URL} target="_blank" rel="noreferrer">
            Open our location in Google Maps →
          </a>
        </section>

        <section className="ct-foot">
          <h2>Have a question first?</h2>
          <p>Fees, EMI, batch timings, prerequisites — a counsellor can answer it in one call.</p>
          <div className="ct-cta">
            <button className="ct-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="ct-btn ct-btn--ghost" to="/for-parents">For parents</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default Contact;

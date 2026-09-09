import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { Link } from "react-router-dom";
import { useAuth } from "../../App";
import "./FAQ.css";

const ORIGIN = "https://restcoderacademy.in";
const MAP_URL = "https://maps.app.goo.gl/XdZWt3oDzGUCL5KWA?g_st=iw";
const PHONE_TEL = "+918073762257";

// Every answer here is a fact already published elsewhere in the app (course
// prices, batch duration/mode, the enquiry form's experience-level options,
// the accountability copy on /for-parents) — nothing invented for this page.
const FAQS = [
  {
    q: "How much do the courses cost?",
    a: "Java Full Stack, Python Full Stack and MERN Stack are ₹35,000 each. Forward Deployed Engineering (FDE), our flagship program, is ₹50,000.",
  },
  {
    q: "Can I pay in EMI?",
    a: "Yes. Checkout is handled securely by Razorpay, which offers EMI alongside UPI, cards and net banking.",
  },
  {
    q: "How long is each course, and is it online or offline?",
    a: "Java Full Stack, Python Full Stack and MERN Stack each run 4 months, offline at our Jayanagar campus in Bengaluru.",
  },
  {
    q: "Do I need prior coding experience?",
    a: "No. We train everyone from complete beginners to working professionals looking to upskill — our enquiry form covers first-year college students, final-year students, and working professionals in both technical and non-technical roles.",
  },
  {
    q: "Do you help with placements?",
    a: "Yes, placement support is part of every course. Our placements carousel names real students and the companies they joined, including SAP Hybris, HCL Technologies and SKAD IT Solutions.",
    linkTo: "/",
    linkState: { scrollTo: "Placements" },
    linkLabel: "See placements",
  },
  {
    q: "How do I know my child is actually progressing?",
    a: "Every week, guardians get attendance, scores, project progress and a placement-readiness read — not just a report at the end.",
    linkTo: "/for-parents",
    linkLabel: "See how it works for parents",
  },
  {
    q: "Where are you located, and can I visit?",
    a: "We're in Jayanagar, Bengaluru — #364, 3rd Floor, 16th Main, 4th T Block East, Pattabhirama Nagar.",
    href: MAP_URL,
    linkLabel: "Get directions",
  },
];

function FAQ() {
  const { openModal } = useAuth();
  const url = `${ORIGIN}/faq`;
  const description =
    "Fees, EMI, course duration, prerequisites, placement support and how guardians see progress — " +
    "answers to the questions we hear most before someone enrols at Rest Coder Academy.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map(({ q, a }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: a },
    })),
  };

  const title = "FAQs — Fees, EMI, Duration & Placements | Rest Coder Academy";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <main className="faq">
        <header className="faq-hero">
          <span className="faq-eyebrow">Frequently asked questions</span>
          <h1>Fees, EMI, duration and placements — answered.</h1>
          <p>
            The questions we hear most before someone enrols. Still have one? A counsellor can
            answer it directly.
          </p>
          <div className="faq-cta">
            <button className="faq-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="faq-btn faq-btn--ghost" to="/">See our courses</Link>
          </div>
        </header>

        <section className="faq-list">
          {FAQS.map((item) => (
            <details className="faq-item" key={item.q}>
              <summary className="faq-q">{item.q}</summary>
              <div className="faq-a">
                <p>{item.a}</p>
                {item.linkTo && (
                  <Link className="faq-a-link" to={item.linkTo} state={item.linkState}>
                    {item.linkLabel} →
                  </Link>
                )}
                {item.href && (
                  <a className="faq-a-link" href={item.href} target="_blank" rel="noreferrer">
                    {item.linkLabel} →
                  </a>
                )}
              </div>
            </details>
          ))}
        </section>

        <section className="faq-foot">
          <h2>Still have a question?</h2>
          <p>A counsellor can walk you through the course, the fees and EMI, and what happens after you enrol.</p>
          <div className="faq-cta">
            <button className="faq-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <a className="faq-btn faq-btn--ghost" href={`tel:${PHONE_TEL}`}>Call us</a>
          </div>
        </section>
      </main>
    </>
  );
}

export default FAQ;

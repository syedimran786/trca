import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { Link } from "react-router-dom";
import { useAuth } from "../../App";
import "./ForParents.css";

const ORIGIN = "https://restcoderacademy.in";

// What guardians see, each with a plain-language line. Kept honest: this is the
// accountability commitment RCA delivers (weekly updates now, the guardian
// dashboard as it rolls out) — not a claim that an app is already deployed.
const SEE = [
  { label: "Attendance", text: "Every class marked, so you know they're actually showing up." },
  { label: "Scores", text: "Assignment and assessment scores as they happen — no waiting for results day." },
  { label: "Project progress", text: "What they're building, and whether it's moving. Real work, visible." },
  { label: "Placement-readiness", text: "An honest read on how job-ready they are, well before the course ends." },
];

function ForParents() {
  const { openModal } = useAuth();
  const url = `${ORIGIN}/for-parents`;
  const description =
    "Most coding institutes go dark after you pay. At Rest Coder Academy, guardians see " +
    "attendance, scores and project progress every week — accountability, so you always know " +
    "how your child is doing.";

  const title = "For Parents — Progress You Can Actually See | Rest Coder Academy";

  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />

      <main className="fp">
        <header className="fp-hero">
          <span className="fp-eyebrow">For parents &amp; guardians</span>
          <h1>You'll never have to wonder how your child is doing.</h1>
          <p>
            Most institutes take the fee and go quiet. Rest Coder Academy is built the opposite way:
            the family sees the progress. Attendance, scores, what they're building, how job-ready
            they are — every week, straight to you.
          </p>
          <div className="fp-cta">
            <button className="fp-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="fp-btn fp-btn--ghost" to="/">See our courses</Link>
          </div>
        </header>

        <section className="fp-problem">
          <h2>The question every parent has after paying</h2>
          <p>
            <em>"Is my child actually attending, learning, and going to get placed — or is this
            money gone?"</em> With most coding classes you simply can't tell until it's too late.
            We think that's backwards. When you're investing in your child's career, you deserve to
            see it working.
          </p>
        </section>

        <section className="fp-see">
          <h2>What you'll see</h2>
          <div className="fp-grid">
            {SEE.map((s) => (
              <div className="fp-card" key={s.label}>
                <h3>{s.label}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="fp-sample">
          <h2>A weekly update, in plain language</h2>
          <p className="fp-sample-note">Here's the kind of summary a guardian receives — a real one is personal to your child.</p>
          <div className="fp-report" aria-label="Sample weekly update">
            <div className="fp-report-head">
              <span>Weekly update · Sample</span>
              <span className="fp-report-course">Java Full Stack</span>
            </div>
            <ul>
              <li><b>Attendance</b><span>4 of 4 classes</span></li>
              <li><b>Latest score</b><span>Assignment — 88%</span></li>
              <li><b>Project</b><span>Shipped a working REST API</span></li>
              <li><b>Placement-readiness</b><span>On track</span></li>
            </ul>
            <p className="fp-report-foot">Delivered on WhatsApp &amp; email — and, as it rolls out, in the guardian dashboard.</p>
          </div>
        </section>

        <section className="fp-why">
          <h2>Why accountability matters</h2>
          <p>
            Visibility isn't just reassurance — it changes outcomes. When a student knows their
            progress is seen, they show up and finish; and students who finish are the ones who get
            placed. Transparency is how we keep everyone — student, family, and us — honest about
            the goal: a real job at the end.
          </p>
        </section>

        <section className="fp-foot">
          <h2>Want to see how it works for your child?</h2>
          <p>Talk to a counsellor — we'll walk you through the course, the fees and EMI, and exactly what you'll see each week.</p>
          <div className="fp-cta">
            <button className="fp-btn" type="button" onClick={openModal}>Talk to a counsellor</button>
            <Link className="fp-btn fp-btn--ghost" to="/">Browse courses</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default ForParents;

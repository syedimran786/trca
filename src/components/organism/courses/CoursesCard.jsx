import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../../App";
import { useFounder, hasFounder } from "../../Pages/useFounder";
import { useTrainers } from "../mentors/useTrainers";
import { useBatches } from "../Batches/useBatches";
import { getNextBatchForCourse, formatBatchDateShort } from "../Batches/batchDateUtils";
import "./CourseCard.css";

// Credibility line under the flagship trainer's name (Nikshep). Other courses
// use the trainer's own profile title.
const FDE_TRAINER_TITLE = "ex-Head of Engineering, Organic Mandya";

const norm = (s) => String(s || "").trim().toLowerCase();
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function Check({ filled }) {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" className="cc-check" aria-hidden="true">
      <circle cx="12" cy="12" r="11" fill={filled ? "#03084C" : "#EAF0F6"} />
      <path d="M7.5 12.3l3 3 6-6.3" stroke={filled ? "#FFFFFF" : "#03084C"} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// Uniform card for every course (Abhigna §5). flagship prop is data-only:
// selects the right syllabus arrays and trainer credibility line — no visual
// difference. Navy header, price slot, equal heights, "Book your seat" primary
// + counsellor secondary on every card.
function CoursesCard({ name, courseId, slug, paid, flagship, price, trainer, audience, backend, frontend, syllabus1, syllabus2 }) {
  const { openEnroll, openModal } = useAuth();
  const { founder } = useFounder();
  const trainers = useTrainers();
  const batches = useBatches();
  const nextBatch = getNextBatchForCourse(name, batches);

  // Match the course's trainer to a full profile (photo + title) so every card
  // shows a "Taught by …" credibility block, not just the flagship.
  const trainerProfile = trainer ? (trainers || []).find((t) => norm(t.name) === norm(trainer)) : null;
  const trainerTitle = flagship ? FDE_TRAINER_TITLE : (trainerProfile && trainerProfile.title) || "";

  // "Meet the founder" belongs on the card whose trainer IS the founder — match
  // the trainer name against the founder's name (either may be the longer form,
  // e.g. "Uday Pawar S" vs "Uday Pawar"), not just the flagship.
  const isFounderCard =
    hasFounder(founder) &&
    trainer &&
    (norm(trainer).includes(norm(founder.name)) || norm(founder.name).includes(norm(trainer)));

  // Clicking a trainer with a profile jumps to the "Our Trainers" section
  // (their full card — photo, bio, expertise, socials). The card only ever
  // renders on the homepage, so a direct scroll is enough.
  const goToTrainers = () => {
    const el = document.getElementById("Trainers");
    if (el) {
      const y = el.getBoundingClientRect().top + window.scrollY - 62; // clear the fixed navbar
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };
  const trainerLinkProps = trainerProfile
    ? {
        role: "link",
        tabIndex: 0,
        title: `See ${trainer}'s profile`,
        onClick: goToTrainers,
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            goToTrainers();
          }
        },
      }
    : {};
  const modules = (
    flagship ? [...(syllabus1 || []), ...(syllabus2 || [])] : [...(backend || []), ...(frontend || [])]
  ).filter(Boolean);
  const book = () => openEnroll({ courseId, name, paid, price });

  /* The syllabus was the only thing making the cards different heights: the
     three standard courses list 10, 9 and 12 modules, which came out as 753,
     727 and 805px cards in a row that is meant to read as a set. Capping the
     list is what makes them match, and the full list is one tap away on the
     course page — which is where #8 wants the traffic anyway. */
  const VISIBLE_MODULES = 8;
  const shownModules = modules.slice(0, VISIBLE_MODULES);
  const hiddenModules = Math.max(0, modules.length - VISIBLE_MODULES);

  return (
    <div className="course-card">
      <div className="cc-head">
        <h3 className="cc-title">{name}</h3>
        <p className="cc-sub">{audience || "For Freshers & Working Professionals"}</p>
        {trainer && (
          <div className={"cc-trainer" + (trainerProfile ? " cc-trainer--link" : "")} {...trainerLinkProps}>
            <span className="cc-avatar">
              {trainerProfile && trainerProfile.photo_url ? (
                <img src={trainerProfile.photo_url} alt={trainer} />
              ) : (
                initials(trainer)
              )}
            </span>
            <span className="cc-trainer-text">
              <b>Taught by {trainer}</b>
              {trainerTitle && <span>{trainerTitle}</span>}
            </span>
          </div>
        )}
        {isFounderCard && (
          <Link className="cc-founder-link" to="/about">Meet the founder →</Link>
        )}
      </div>

      <div className="cc-body">
        <div className="cc-price-row">
          {paid ? (
            <span className="cc-price">
              ₹{Number(price).toLocaleString("en-IN")} <small>· EMI available</small>
            </span>
          ) : (
            <span className="cc-price cc-price--request">Fee on request</span>
          )}
        </div>

        <div className={"cc-schedule" + (nextBatch ? "" : " cc-schedule--soon")}>
          {nextBatch ? (
            <>
              <span className="cc-sched-label">Next batch</span>
              <span className="cc-sched-main">
                {[nextBatch.day, formatBatchDateShort(nextBatch.date), nextBatch.time].filter(Boolean).join(" · ")}
              </span>
              <span className="cc-sched-meta">
                {[nextBatch.mode, nextBatch.duration].filter(Boolean).join(" · ")}
              </span>
            </>
          ) : (
            "New dates coming soon"
          )}
        </div>

        <div className="cc-syllabus">
          <div className="cc-syllabus-label">What you'll learn</div>
          <ul>
            {shownModules.map((m, i) => (
              <li key={i}>
                <Check filled={false} />
                <span>{m}</span>
              </li>
            ))}
          </ul>
          {/* A reserved row, not conditional markup. With extra modules it is a
              link to the full syllabus; without, it is an empty spacer of the
              same height — so a course with nine modules and one with twelve
              produce a card of exactly the same height. */}
          <div className="cc-syllabus-more">
            {hiddenModules > 0 ? (
              <Link to={`/courses/${slug || courseId}`}>
                +{hiddenModules} more {hiddenModules === 1 ? "module" : "modules"}
              </Link>
            ) : (
              <span aria-hidden="true" />
            )}
          </div>
        </div>

        <div className="cc-foot">
          <button className="cc-book" type="button" onClick={book}>
            Book your seat
          </button>
          <button className="cc-counsellor" type="button" onClick={() => openModal(name)}>
            {slug === 'forward-deployed-engineering' ? 'Or talk to the instructor first' : 'Or talk to a counsellor first'}
          </button>
          <Link className="cc-details" to={`/courses/${slug || courseId}`}>
            Full syllabus &amp; details →
          </Link>
        </div>
      </div>
    </div>
  );
}

export default CoursesCard;

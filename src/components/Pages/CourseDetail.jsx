import React from "react";
import SocialMeta from "../atoms/SocialMeta/SocialMeta";
import { useParams, Navigate, Link } from "react-router-dom";
import { useAuth } from "../../App";
import { courses } from "../organism/courses/courses";
import { getCourseContent } from "../organism/courses/courseContent";
import { useBatches } from "../organism/Batches/useBatches";
import { getNextBatchForCourse, formatBatchDateShort } from "../organism/Batches/batchDateUtils";
import { useTrainers } from "../organism/mentors/useTrainers";
import MentorIcons from "../organism/mentors/MentorIcons";
import "./CourseDetail.css";

const ORIGIN = "https://restcoderacademy.in";

const norm = (s) => String(s || "").trim().toLowerCase();
function initials(name = "") {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

function CourseDetail() {
  const { slug } = useParams();
  const { openEnroll, openModal } = useAuth();
  const batches = useBatches();
  const trainers = useTrainers();

  const course = courses.find((c) => c.slug === slug || c.courseId === slug);
  // Unknown course → home (router already redirects unknown paths, this guards
  // a real /courses/<garbage>).
  if (!course) return <Navigate to="/" replace />;

  const content = getCourseContent(course.slug || course.courseId);
  const next = getNextBatchForCourse(course.name, batches);
  // The course's trainer (course.trainer, else the next batch's) matched to a
  // full profile from /admin/trainers, so students can verify credibility.
  const trainerName = course.trainer || next?.trainer || "";
  const trainer = trainerName
    ? (trainers || []).find((t) => norm(t.name) === norm(trainerName))
    : null;
  const trainerSkills = ((trainer && trainer.expertise) || "").split(",").map((s) => s.trim()).filter(Boolean);
  const modules = (
    course.flagship
      ? [...(course.syllabus1 || []), ...(course.syllabus2 || [])]
      : [...(course.backend || []), ...(course.frontend || [])]
  ).filter(Boolean);

  const url = `${ORIGIN}/courses/${course.slug || course.courseId}`;
  const priceLabel = `₹${Number(course.price).toLocaleString("en-IN")}`;
  const formatLabel = next
    ? [next.duration, next.mode].filter(Boolean).join(" · ")
    : "";
  const nextLabel = next
    ? [next.day, formatBatchDateShort(next.date), next.time].filter(Boolean).join(" · ")
    : "New dates coming soon";
  const description =
    `Learn ${course.name} at Rest Coder Academy, Bengaluru — live, project-based training ` +
    `with placement support and EMI (${priceLabel}).` +
    (next ? ` Next batch: ${next.day}, ${formatBatchDateShort(next.date)}.` : "");

  const courseSchema = {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.name,
    description,
    provider: {
      "@type": "EducationalOrganization",
      name: "Rest Coder Academy",
      sameAs: `${ORIGIN}/`,
    },
    url,
    offers: {
      "@type": "Offer",
      category: "Paid",
      price: String(course.price),
      priceCurrency: "INR",
    },
  };

  // FAQPage schema — Google/Bing surface these as rich results in SERPs and
  // AI answer engines (ChatGPT, Claude, Perplexity) cite FAQ answers heavily.
  // Only emitted when the course has hand-written FAQ content.
  const faqSchema = content && content.faq && content.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: content.faq.map((item) => ({
          "@type": "Question",
          name: item.q,
          acceptedAnswer: { "@type": "Answer", text: item.a },
        })),
      }
    : null;

  const title = `${course.name} Course in Bengaluru — Rest Coder Academy`;

  return (
    <>
      {/* React 19 hoists these to <head>. */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <SocialMeta title={title} description={description} url={url} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(courseSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      <main className="cd">
        <nav className="cd-crumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span>/</span>
          <span>Courses</span>
          <span>/</span>
          <span aria-current="page">{course.name}</span>
        </nav>

        <header className="cd-hero">
          {course.flagship && <span className="cd-flag">★ Flagship program</span>}
          <h1>{course.name}</h1>
          <p className="cd-aud">{course.audience || "For Freshers & Working Professionals"}</p>
          <div className="cd-meta">
            <span className="cd-price">{priceLabel}<small> · EMI available</small></span>
            <span className="cd-batch"><b>Next batch</b> {nextLabel}</span>
            {/* Duration and mode (#12). They were on the card but not here, so
                the page a Java Full Stack ad lands on said less about the
                course than the card the visitor had already scrolled past.
                Both come off the batch, and the row is only rendered when
                there is a batch to read them from. */}
            {formatLabel && (
              <span className="cd-format"><b>Format</b> {formatLabel}</span>
            )}
            {course.flagship && course.trainer && (
              <span className="cd-trainer"><b>Trainer</b> {course.trainer}</span>
            )}
          </div>
          <div className="cd-cta">
            <button className="cd-book" type="button" onClick={() => openEnroll({ courseId: course.courseId, name: course.name, paid: course.paid, price: course.price })}>
              Book your seat
            </button>
            {/* FDE is a ₹50k senior-track program taught by a working
                engineer — the prospect wants to talk to the instructor, not
                a counsellor. The other courses (parent-buyer shaped) keep
                the counsellor framing. */}
            <button className="cd-talk" type="button" onClick={() => openModal(course.name)}>
              {course.slug === 'forward-deployed-engineering' ? 'Talk to the instructor' : 'Talk to a counsellor'}
            </button>
          </div>
        </header>

        {content?.intro && (
          <section className="cd-intro">
            <p>{content.intro}</p>
          </section>
        )}

        <section className="cd-accountability">
          <h2>Accountability your family can see</h2>
          <p>
            Unlike most institutes, Rest Coder Academy gives guardians a live view of a student's
            progress, scores and attendance — every week. You always know exactly how the learning
            is going, so nobody is left guessing.
          </p>
          <Link className="cd-parents-link" to="/for-parents">See how it works for parents →</Link>
        </section>

        {content?.whoFor && (
          <section className="cd-whofor">
            <h2>Who this course is for</h2>
            <ul>
              {content.whoFor.map((w, i) => (
                <li key={i}>{w}</li>
              ))}
            </ul>
          </section>
        )}

        {content?.prerequisites && (
          <section className="cd-prereq">
            <h2>Prerequisites</h2>
            <p>{content.prerequisites}</p>
          </section>
        )}

        <section className="cd-syllabus">
          <h2>What you'll {course.flagship ? "master" : "learn"}</h2>
          <ul>
            {modules.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        </section>

        {content?.outcomes && (
          <section className="cd-outcomes">
            <h2>What you can do after this course</h2>
            <ul>
              {content.outcomes.map((o, i) => (
                <li key={i}>{o}</li>
              ))}
            </ul>
          </section>
        )}

        {content?.projects && (
          <section className="cd-projects">
            <h2>Projects you&rsquo;ll ship</h2>
            <ul>
              {content.projects.map((p, i) => (
                <li key={i}>
                  <strong>{p.name}.</strong> {p.detail}
                </li>
              ))}
            </ul>
          </section>
        )}

        {content?.careerPaths && (
          <section className="cd-careers">
            <h2>Career paths this course opens</h2>
            <ul>
              {content.careerPaths.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
            </ul>
            <p>
              Placement support is real, not a promise — see named graduates and the companies
              they joined on our <Link to="/placements">Placements page</Link>.
            </p>
          </section>
        )}

        {trainer && (
          <section className="cd-trainer">
            <h2>Your trainer</h2>
            <div className="cd-tr">
              <div className="cd-tr-photo">
                {trainer.photo_url ? (
                  <img src={trainer.photo_url} alt={trainer.name} />
                ) : (
                  <span className="cd-tr-initials">{initials(trainer.name)}</span>
                )}
              </div>
              <div className="cd-tr-body">
                <h3>{trainer.name}</h3>
                {trainer.title && <p className="cd-tr-title">{trainer.title}</p>}
                {trainer.experience && <p className="cd-tr-exp">{trainer.experience} experience</p>}
                {trainerSkills.length > 0 && (
                  <div className="cd-tr-skills">
                    {trainerSkills.map((s, i) => (
                      <span key={i}>{s}</span>
                    ))}
                  </div>
                )}
                {trainer.bio && <p className="cd-tr-bio">{trainer.bio}</p>}
                <div className="cd-tr-links">
                  <MentorIcons trainer={trainer} />
                  {trainer.certificate_url && (
                    <a className="cd-tr-cert" href={trainer.certificate_url} target="_blank" rel="noreferrer">
                      View certificate
                    </a>
                  )}
                </div>
                <p className="cd-tr-verify">See their profiles and verify for yourself — you should know exactly who's teaching you.</p>
              </div>
            </div>
          </section>
        )}

        {content?.faq && (
          <section className="cd-faq">
            <h2>Frequently asked questions</h2>
            <dl>
              {content.faq.map((item, i) => (
                <div className="cd-faq-item" key={i}>
                  <dt>{item.q}</dt>
                  <dd>{item.a}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <section className="cd-related">
          <h2>Related reading</h2>
          <ul>
            <li><Link to="/for-parents">Guardian dashboard — what parents actually see</Link></li>
            <li><Link to="/placements">Placements — named graduates and where they joined</Link></li>
            <li><Link to="/blog/java-vs-python-full-stack">Java vs Python for full-stack: which should you learn first?</Link></li>
            <li><Link to="/blog/is-a-coding-course-worth-it-2026">Is a coding course worth it in 2026? An honest look</Link></li>
          </ul>
        </section>

        <section className="cd-foot">
          <h2>Ready to join {course.name}?</h2>
          <p>{priceLabel} · EMI available · placement support · live, project-based cohort in Bengaluru.</p>
          <div className="cd-cta">
            <button className="cd-book" type="button" onClick={() => openEnroll({ courseId: course.courseId, name: course.name, paid: course.paid, price: course.price })}>
              Book your seat
            </button>
            <Link className="cd-back" to="/" state={{ scrollTo: "Courses" }}>← All courses</Link>
          </div>
        </section>
      </main>
    </>
  );
}

export default CourseDetail;

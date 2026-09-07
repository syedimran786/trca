// Per-course landing-page content. Kept separate from courses.js so the
// catalogue stays a lean price/trainer/module list, and the detail-page copy
// can grow (career outcomes, projects, FAQ, module deep-dives) without
// bloating the catalogue object. Keyed by slug — CourseDetail.jsx looks up
// getCourseContent(slug) and renders whichever sections exist.
export const courseContent = {
  "forward-deployed-engineering": {
    intro:
      "Forward Deployed Engineering (FDE) is the program a former Head of Engineering built to train the kind of hire he was tired of not being able to find: someone who can walk into a real codebase, ship a feature end-to-end, own its production behaviour, and talk to the customer about it. It is intentionally different from a bootcamp — you spend most of your time in a real repo, not a slide deck. A note on the name: we teach the original discipline the term comes from — production engineering under senior mentorship, in the sense Palantir used it. AI companies have recently reused “Forward Deployed Engineer” for LLM/RAG/agent-deployment roles; that is a different job and we do not teach it here.",
    whoFor: [
      "Recent CS/IT graduates who can write basic code but have never shipped anything a stranger uses.",
      "Working engineers 0–3 years in who feel they got hired but never actually got trained.",
      "Career switchers with a strong technical background (data, QA, DevOps, analyst) who want to move into product engineering.",
    ],
    prerequisites:
      "You should be comfortable writing basic programs in at least one language (Python, JavaScript or Java) and be OK with the command line. You do not need prior React, cloud, or DevOps experience — the program teaches those from scratch. What we can't teach in eight weeks: the habit of showing up. FDE is a full-time commitment.",
    outcomes: [
      "Ship a full-stack application to production — real domain, real users, real payments.",
      "Own a CI/CD pipeline: pull request → automated tests → gated staging → production, without a senior babysitting the deploy.",
      "Debug live: read logs, trace a request through a distributed system, and roll back safely when something breaks.",
      "Design and implement REST APIs that other engineers can actually consume, with authentication, rate limits, and useful error responses.",
      "Wire real integrations: payment gateways, webhooks, third-party APIs — the parts of engineering that tutorials skip.",
      "Talk about your work like a product engineer, not a coder — trade-offs, cost, risk, timeline.",
    ],
    careerPaths: [
      "Forward Deployed Engineer at product startups",
      "Full-Stack Engineer at SaaS companies",
      "Solutions Engineer / Implementation Engineer",
      "Product Engineer at early-stage startups",
      "Software Development Engineer (SDE-I / SDE-II) at scale-ups",
    ],
    projects: [
      {
        name: "A production SaaS with paid customers",
        detail:
          "You build a real product — pick your problem, we help you scope it — with authentication, payments, a working admin panel, and observability. It runs on your own domain by week six and ships publicly at graduation.",
      },
      {
        name: "A gated CI/CD pipeline",
        detail:
          "GitHub Actions running your unit + integration tests, previewing every PR, deploying to staging on merge, and promoting to production only after a smoke check passes. You configure it from empty repo to green production deploy.",
      },
      {
        name: "A third-party integration end-to-end",
        detail:
          "One real integration — Razorpay/Stripe checkout, Twilio SMS, a webhook consumer, a scraping pipeline — built defensively: retries, idempotency, dead-letter handling. Not a happy-path demo.",
      },
    ],
    faq: [
      {
        q: "How is Forward Deployed Engineering different from a normal full-stack bootcamp?",
        a: "A bootcamp teaches you a stack. FDE teaches you the job around the stack — reading someone else's code, shipping to production, handling incidents, owning integrations, talking to non-engineers about technical trade-offs. You still learn the stack (React/Next.js, APIs, Postgres, cloud), but you spend more time in real repos and production tooling than any bootcamp we know of.",
      },
      {
        q: "Do I need to be a strong programmer already?",
        a: "You need to be comfortable writing basic programs in one language and using the command line. You do not need React, cloud, or DevOps experience. If you have never written code in your life, start with our Java or Python full-stack course first.",
      },
      {
        q: "What is the fee, and is EMI available?",
        a: "The FDE program is ₹50,000. EMI plans are available at no interest through our partner — we walk you through it during enrolment.",
      },
      {
        q: "Do you guarantee a job at the end?",
        a: "No, and be cautious of anyone who does. We guarantee that you will ship real production software, that you will be interview-ready, and that we will actively work our network to open doors for you. What we cannot guarantee is that you show up every day — that part is on you.",
      },
      {
        q: "Is the program in-person or online? What are the timings?",
        a: "Our default cohort is in-person in Jayanagar, Bengaluru, weekdays, full-time. We occasionally run a part-time evening cohort for working engineers — check the Next batch line at the top of this page for the current dates and mode.",
      },
      {
        q: "Who teaches FDE?",
        a: "Nikshep Kulli, formerly Head of Engineering, who built this program from the training material he used with his own team. His profile with credentials and links is on this page and on the Placements page.",
      },
    ],
  },

  "java-full-stack": {
    intro:
      "Live, project-based Java full-stack training in Jayanagar, Bengaluru. You learn Core Java, Advanced Java, Spring & Spring Boot, Hibernate, microservices and REST APIs on the backend; HTML, CSS, JavaScript and Tailwind on the front end — then you build and ship real projects that use them together. No recorded videos, no self-paced drift, no vague placement talk.",
    whoFor: [
      "Recent BCA, BE/BTech, MCA graduates targeting service-companies and product-engineering roles.",
      "Working professionals from testing, support, or non-engineering backgrounds who want to move into Java development.",
      "Career switchers who prefer a strictly-typed, enterprise-grade language and want the widest possible job market in India.",
    ],
    prerequisites:
      "No prior Java experience required. You should be comfortable with basic computer usage and English instruction. If you already know some Java (up to OOP), you will move faster in the first few weeks — but the course starts from fundamentals so nobody is left behind.",
    outcomes: [
      "Write clean, testable Java 21 code using modern language features.",
      "Build REST APIs with Spring Boot — validation, exception handling, dependency injection, layered architecture.",
      "Model data with JPA / Hibernate: entities, relationships, transactions, migrations.",
      "Split a monolith into small microservices with clean HTTP contracts between them.",
      "Consume APIs from a responsive front end you built with modern HTML/CSS/JavaScript and Tailwind.",
      "Debug the full stack — read a stack trace, inspect network calls, trace a bug from UI back to a DB query.",
    ],
    careerPaths: [
      "Java Developer / Backend Engineer at services companies (Infosys, TCS, Wipro, Capgemini, HCL)",
      "Full-Stack Developer at product companies",
      "Junior Software Engineer at Bengaluru startups",
      "Application Engineer at enterprise software firms",
    ],
    projects: [
      {
        name: "A REST-API-backed web application",
        detail:
          "A working full-stack app of your choice (a bookstore, a job board, an event platform) with Spring Boot APIs, JPA/Hibernate persistence, JWT authentication, and a modern front end you built yourself.",
      },
      {
        name: "A microservices refactor",
        detail:
          "You take one of the applications above and cleanly split it into services (users, catalogue, orders) with independent deployments and inter-service HTTP — the pattern you will see in every real Java codebase you join.",
      },
      {
        name: "A capstone with real integrations",
        detail:
          "Your final project ships publicly with real integrations — payment gateway, email/SMS notifications, file storage — the pieces that turn a demo into something a stranger can actually use.",
      },
    ],
    faq: [
      {
        q: "Is Java still a good career choice in 2026?",
        a: "Yes — the volume of Java hiring in India is larger than any other backend language, and it isn't shrinking. Enterprises, banks and services companies run enormous Java codebases and hire steadily. Python and JavaScript grow faster, but Java has the biggest absolute pool of openings.",
      },
      {
        q: "What is the course fee, and is EMI available?",
        a: "The course is ₹35,000. EMI plans are available at no interest through our partner — we walk you through it during enrolment.",
      },
      {
        q: "How long is the course? What are the class timings?",
        a: "The course runs over several months as a live, in-person cohort in Jayanagar, Bengaluru. The Next batch line at the top of this page shows the current start date, day/time and mode — either an active batch or a note that fresh dates are coming.",
      },
      {
        q: "Do you provide placement support?",
        a: "Yes — active placement support, not vague promises. We prepare you with mock interviews, resume review and portfolio work, and we actively refer graduates into our hiring-partner network. Real placed graduates are named on our Placements page so you can verify.",
      },
      {
        q: "Should I learn Java or Python first?",
        a: "Both lead to jobs and neither is a dead end. Java gives you the widest raw pool of openings and is stricter (which large teams like); Python gives you a faster start, cleaner syntax and a runway into data/AI. If you already lean toward one, follow it. Our blog post \"Java vs Python for full-stack\" walks through this in more detail.",
      },
    ],
  },

  "python-full-stack": {
    intro:
      "Live, project-based Python full-stack training in Jayanagar, Bengaluru. Core Python, Advanced Python, Django, REST APIs and microservices on the backend; HTML, CSS, JavaScript and Tailwind on the front end. You spend most of your time actually building — not watching pre-recorded videos or copying exercises.",
    whoFor: [
      "Recent graduates who want to break into web development with the fastest-growing web language.",
      "Working professionals from data, QA, scripting or automation backgrounds who want to move into full-stack development.",
      "Career switchers who value readable code, faster iteration and a runway that opens into data engineering or AI later.",
    ],
    prerequisites:
      "No prior Python experience required. You should be comfortable with basic computer usage and English instruction. If you already write Python for scripting or data, you will move faster in the first few weeks — but the course starts from fundamentals.",
    outcomes: [
      "Write clean, idiomatic Python 3 — comprehensions, generators, decorators, typing, packaging.",
      "Build REST APIs with Django (and Django REST Framework) — auth, serializers, permissions, admin, migrations.",
      "Model data properly: relationships, indexes, migrations, when to reach past the ORM to raw SQL.",
      "Split larger applications into small services with clean HTTP contracts.",
      "Consume your APIs from a responsive front end you built with modern HTML/CSS/JavaScript and Tailwind.",
      "Ship real applications — deploy, monitor, iterate — not just build in a notebook.",
    ],
    careerPaths: [
      "Python / Django Developer at product startups",
      "Full-Stack Developer at SaaS companies",
      "Backend Engineer at data-heavy or AI-adjacent teams",
      "Junior Software Engineer at Bengaluru startups",
    ],
    projects: [
      {
        name: "A Django-backed web application",
        detail:
          "A working full-stack app of your choice with Django REST APIs, PostgreSQL, authentication, background jobs, and a modern front end you built yourself.",
      },
      {
        name: "A services-split refactor",
        detail:
          "Take your application and cleanly split it — users, catalogue, jobs — into small services with their own deploy lifecycles. The shape of every real Python backend you will join.",
      },
      {
        name: "A capstone with real integrations",
        detail:
          "Your final project ships publicly with real integrations: payments, email/SMS, file storage, third-party APIs. Not a happy-path demo.",
      },
    ],
    faq: [
      {
        q: "Is Python full-stack a real career path?",
        a: "Yes. Django and FastAPI power a large slice of Indian startups, and Python-heavy shops (data, AI-adjacent) hire full-stack Python engineers steadily. Python has fewer openings than Java in raw volume, but the growth rate is significantly higher.",
      },
      {
        q: "What is the course fee, and is EMI available?",
        a: "The course is ₹35,000. EMI plans are available at no interest through our partner — we walk you through it during enrolment.",
      },
      {
        q: "How long is the course? What are the class timings?",
        a: "The course runs as a live, in-person cohort in Jayanagar, Bengaluru over several months. The Next batch line at the top of this page shows the current start date, day/time and mode.",
      },
      {
        q: "Will this help me move into data or AI later?",
        a: "Yes — Python is the shared language between web, data and AI. A Python full-stack foundation gives you a much shorter runway to move into data engineering or ML engineering later than a Java-only background would.",
      },
      {
        q: "Do you provide placement support?",
        a: "Yes — mock interviews, resume review, portfolio work, and active referrals into our hiring-partner network. Placed graduates are named on our Placements page.",
      },
    ],
  },

  "mern-stack": {
    intro:
      "Live, project-based MERN full-stack training in Jayanagar, Bengaluru. MongoDB, Express, React and Node on the backend + front end, with TypeScript and Next.js layered on so you graduate with the modern JavaScript stack most Indian startups actually run. You build and ship — not watch and copy.",
    whoFor: [
      "Recent graduates targeting startup roles where React/Node is the default stack.",
      "Working professionals who want to move into modern JavaScript development.",
      "Career switchers who want one language across the whole stack.",
    ],
    prerequisites:
      "No prior JavaScript required, but you should be comfortable with basic computer usage. If you already know HTML/CSS or a bit of JavaScript, you will move faster in the first few weeks — but the course begins from fundamentals.",
    outcomes: [
      "Write modern JavaScript and TypeScript — modules, async/await, types, generics.",
      "Build REST APIs and small services with Node.js and Express.",
      "Model data in MongoDB — schema design, indexes, aggregations, when to normalise vs denormalise.",
      "Build a responsive, accessible React front end with modern patterns (hooks, context, server components where appropriate).",
      "Deploy full-stack applications with Next.js — SSR, SSG, ISR, API routes.",
      "Ship real applications — auth, payments, integrations, observability — not tutorials.",
    ],
    careerPaths: [
      "MERN / Full-Stack Developer at startups",
      "React Developer / Frontend Engineer at product companies",
      "Node.js Backend Engineer at SaaS companies",
      "Next.js Developer at agencies and product teams",
    ],
    projects: [
      {
        name: "A MERN + Next.js application",
        detail:
          "A working full-stack app with MongoDB, Express/Next API routes, JWT authentication, and a React/Next front end you built yourself.",
      },
      {
        name: "A TypeScript refactor",
        detail:
          "You take a JavaScript codebase and migrate it to TypeScript, learning the practical patterns you will need on any real MERN team.",
      },
      {
        name: "A capstone with real integrations",
        detail:
          "Ships publicly with payments, email, file uploads, and a real domain — a real product, not a demo.",
      },
    ],
    faq: [
      {
        q: "Is MERN still relevant in 2026?",
        a: "Yes. React remains the dominant front-end library, and Node.js is the default backend at most Indian startups. Adding TypeScript and Next.js — which we do — brings you up to what production stacks actually look like today.",
      },
      {
        q: "What is the course fee, and is EMI available?",
        a: "The course is ₹35,000. EMI plans are available at no interest through our partner.",
      },
      {
        q: "How long is the course? What are the class timings?",
        a: "The course runs as a live, in-person cohort in Jayanagar, Bengaluru over several months. Check the Next batch line at the top of this page for the current start date, day/time and mode.",
      },
      {
        q: "Do I need to learn Java or Python first?",
        a: "No. If your goal is to work at a modern JavaScript-first startup, MERN is a straight path — you don't need Java or Python first. If you want to keep your options open across enterprise + startup, Java gives you a broader base.",
      },
      {
        q: "Do you provide placement support?",
        a: "Yes — mock interviews, resume review, portfolio review, active referrals into our hiring network. Placed graduates are on our Placements page.",
      },
    ],
  },
};

export function getCourseContent(slug) {
  return courseContent[slug] || null;
}

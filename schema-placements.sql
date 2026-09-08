-- Placements — the site's success stories, moved out of a hardcoded array (#145).
--
-- Applies to the same D1 database as the existing tables (binding `DB` in
-- wrangler.toml). Run locally:
--   npx wrangler d1 execute restcoder-enquiries --local --file=schema-placements.sql
-- Against the remote DB:
--   npx wrangler d1 execute restcoder-enquiries --remote --file=schema-placements.sql
--
-- Why: the team announces placements on Instagram in real time, but nobody
-- runs a commit → PR → deploy cycle to add them to the site, so the site is
-- permanently behind. An admin form makes publishing a placement about as much
-- work as posting one.

CREATE TABLE IF NOT EXISTS placements (
  id                TEXT PRIMARY KEY,           -- crypto.randomUUID() from app
  name              TEXT NOT NULL,              -- student name as shown publicly
  designation       TEXT,                       -- role at the company
  company_name      TEXT,
  company_logo_url  TEXT,
  photo_url         TEXT,
  description       TEXT,                       -- the student's own testimonial
  background        TEXT,                       -- one line of context, for /placements
  journey           TEXT,                       -- 1-3 sentences, for /placements
  linkedin_url      TEXT,                       -- enriches Person JSON-LD via sameAs
  course_slug       TEXT,                       -- links to /courses/<slug>
  instagram_url     TEXT,                       -- renders IG's official embed instead
  is_published      INTEGER NOT NULL DEFAULT 0, -- curate rather than auto-publish
  display_order     INTEGER NOT NULL DEFAULT 0,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- The public endpoint only ever reads published rows in display order, so that
-- is the index. Everything else is an admin query over a table of tens of rows.
CREATE INDEX IF NOT EXISTS idx_placements_published
  ON placements (is_published, display_order, created_at);

-- ---------------------------------------------------------------------------
-- Seed: the records currently hardcoded in placement.js
-- ---------------------------------------------------------------------------
-- Seeded so the site looks identical the moment it starts reading from D1 —
-- the switch should be invisible to a visitor.
--
-- `designation` and `company_*` are NULLable and `instagram_url` exists because
-- of Kota Akshay below: an IG-embed-only record where the embed carries the
-- photo, company and testimonial. #145's original field list predates that
-- record; placement.js's own comment says it should migrate as-is, so it does.
--
-- photo_url / company_logo_url use `bundled:<key>` for the four records whose
-- images are Vite asset imports. Their real URLs contain a content hash that
-- only exists after a build, so no literal URL can be written here. The client
-- resolves the key against the same imports the fallback array uses, which is
-- what keeps these four pixel-identical. Anything added through the admin form
-- carries an ordinary URL and needs no such treatment.

INSERT OR IGNORE INTO placements
  (id, name, designation, company_name, company_logo_url, photo_url,
   background, description, is_published, display_order)
VALUES
  ('seed-ashish', 'Ashish Jadhav', 'SAP Hybris Developer', 'SAP Hybris',
   'bundled:sapHybris', 'bundled:ashish',
   'Non-IT background from Maharashtra; moved to Bengaluru to switch into engineering.',
   'Uday Sir is an exceptional mentor who transformed my career prospects. Despite being a non-IT background student from Maharashtra, I thrived under his guidance in Bangalore. His teaching style is concise, clear, and engaging. Uday Sir''s patience and willingness to help are admirable. He creates a supportive environment, encouraging students to ask questions. His friendly nature makes complex concepts accessible and enjoyable.',
   1, 10),

  ('seed-sakshi', 'Sakshi', 'Software Engineer', 'HCL Technologies',
   'bundled:hcl', 'bundled:sakshi', NULL,
   'Uday Sir is an exceptional Java programming teacher, known for his deep knowledge and engaging teaching style. His ability to simplify complex concepts makes learning Java both easy and enjoyable. With a passion for coding and a dedication to his students'' success, he ensures that everyone gains a strong foundation in programming. His guidance not only helps students master Java but also instills confidence in problem-solving and logical thinking.',
   1, 20),

  ('seed-sujith', 'Sujith', 'Software Engineer', 'SKAD IT Solutions',
   'bundled:skad', 'bundled:sujith', NULL,
   'The coaching institute offers an exceptional Java and Python Full stack  course with comprehensive coverage of Core Java, Springs,Hibernate,SQL,Python,Django. Uday sir''s expert guidance on backend development is complemented perfectly. His combined industry experience and personalized mentoring ensure students gain practical skills through hands-on projects. The institute maintains small batch sizes, creating an interactive learning environment.',
   1, 30),

  ('seed-prajwala', 'Prajwala R', 'Test Automation Engineer', 'Quality Service Group',
   'bundled:qsg', 'bundled:prajwala', NULL,
   'Uday sir is a fantastic Java trainer who breaks down complex topics into simple, easy-to-grasp concepts. He creates a supportive learning environment that encourages students to ask questions and grow. What sets him apart is his ability to adapt to different learning styles and pace.I''m grateful for his mentorship, which helped me achieve my goals. Finally thanks to all the team members of rest coder academy.',
   1, 40);

INSERT OR IGNORE INTO placements
  (id, name, background, instagram_url, is_published, display_order)
VALUES
  ('seed-kota-akshay', 'Kota Akshay Rathna Kumar', 'B.Tech CSE, 2026 graduate',
   'https://www.instagram.com/p/Dc5o-Uatcxz/', 1, 50);

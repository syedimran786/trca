-- Enrolments, viewable at /admin/enrollments.
-- Two kinds share this table:
--   status='paid'       — a completed, signature-verified Razorpay payment (FDE).
--   status='registered' — a free "register interest" for an unpriced course.
CREATE TABLE IF NOT EXISTS enrollments (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  fullname          TEXT NOT NULL,
  mobile            TEXT NOT NULL,
  email             TEXT,
  experience        TEXT,
  course            TEXT NOT NULL,      -- course id, e.g. 'fde'
  course_name       TEXT,               -- human label at time of enrolment
  batch             TEXT,               -- chosen batch (name + date), optional
  referral          TEXT,               -- from ?ref= — also lands in Razorpay notes
  amount            INTEGER,            -- paise, for paid enrolments
  currency          TEXT NOT NULL DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  -- 'registered'   free interest, no payment
  -- 'paid'         payment confirmed against Razorpay's payment object
  -- 'needs_review' payment verified by signature, but Razorpay was unreachable
  --                so the course and amount could not be confirmed (#165) —
  --                the money is real; a human reconciles it from the payment id
  status            TEXT NOT NULL DEFAULT 'registered',
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- One row per Razorpay order — makes payment recording idempotent (a retried
-- verify can't create a second paid enrolment for the same order).
CREATE UNIQUE INDEX IF NOT EXISTS idx_enrollments_order
  ON enrollments (razorpay_order_id)
  WHERE razorpay_order_id IS NOT NULL;

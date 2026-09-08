/**
 * Above-the-fold copy (#9).
 *
 * The rule this file exists to enforce: every line here is one Uday can back
 * with a name, an offer letter or an address. What was here before — "we are
 * dedicated to shaping the future of coding ... empowers individuals to master
 * the skills needed for success in the tech industry" — is 70 words that a
 * competing academy's homepage could run unchanged, and contains no fact
 * anyone can check.
 *
 * Where each claim below comes from:
 *   Jayanagar, Bengaluru  → the address already published in FooterAddress.jsx
 *   Java / Python / MERN  → courses.js
 *   four months, offline  → batches.js (`duration`, `mode`)
 *   Uday Pawar S          → batches.js (`trainer`)
 *
 * ⚠️ COPY NEEDS UDAY'S SIGN-OFF BEFORE THIS SHIPS. The lines above are drawn
 * from what the site already claims, but he is the one who has to stand behind
 * them.
 */

export const heroCopy = {
  /**
   * #142's H1, adopted on merge rather than overwritten.
   *
   * This file originally kept "Code Your Dreams Into Reality" on the grounds
   * that #9 does not touch the headline. #142 then landed the keyword H1 and
   * verified it on prod, so keeping the old line would have quietly reverted a
   * shipped SEO fix — the headline moves here instead, where the rest of the
   * above-the-fold copy already lives.
   */
  title: "Live Full-Stack Coding Classes in Jayanagar, Bengaluru",

  /**
   * Replaces the mission paragraph. Specific, and every part is checkable.
   *
   * Trimmed when #142's H1 arrived: it used to open "Offline full-stack
   * training in Jayanagar, Bengaluru", which now repeats the headline word for
   * word. The subhead earns its line by carrying what the H1 does not — which
   * languages, how long, and who teaches it.
   */
  subhead:
    "Java, Python and MERN — four months in a classroom, taught by Uday Pawar S.",

  proofLabel: "Our students work at",

  cta: "Register Now",

  /** Prefix for the live batch date, e.g. "Next batch · 16 Sep". */
  nextBatchLabel: "Next batch",
};

/**
 * ⚠️ UNCONFIRMED — the one number #9 asks for and the repo cannot supply.
 *
 * Set this to the real figure once Uday confirms it, e.g.
 *   export const placedCount = 120
 * and the hero will show "120+ students placed" above the logos.
 *
 * It is `null` on purpose rather than a plausible-looking guess: a placement
 * count is exactly the kind of claim a visitor may hold us to, and inventing
 * one would undo the point of this ticket. The layout reserves the row either
 * way, so filling it in later moves nothing on the page.
 */
export const placedCount = null;

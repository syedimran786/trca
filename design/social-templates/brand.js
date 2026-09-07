/**
 * The single source of every string that appears on a social graphic (#151).
 *
 * The problem this file exists to solve: the recurring templates lived only
 * inside a design tool, so `www.restcoderacademy.com` — a domain that has been
 * dead since the GoDaddy registration lapsed — was baked into every placement
 * announcement, festival greeting and batch launch RCA has ever published.
 * Nobody could fix it without opening the master file, and nobody could tell
 * from the repo that it was wrong.
 *
 * Now the URL is one line here. Changing it and re-running the build reprints
 * every template. The same goes for the phone numbers, which had drifted from
 * the ones on the site.
 *
 * Deliberately NOT a re-brand: the colours, type scale and layouts below are
 * transcribed from the existing graphics, not redesigned. #151 is a string
 * swap; this is the machinery that makes the next one a string swap too.
 */

/* Bare apex, no `www.`, no protocol.
 *
 * The `www.` matters: Cloudflare 301s www→apex (#15), so printing `www.` on a
 * graphic sends every prospect who types it through a needless hop. The
 * protocol is omitted because the existing graphics omit it and the ticket
 * asks not to introduce one. */
export const SITE_URL = "restcoderacademy.in";

/* Both verified against the live Instagram templates during the #151 audit.
 * PRIMARY is the number already on the website and in the JSON-LD; SECONDARY
 * appears only on the placement template. If either changes, this is the only
 * place to edit. */
export const PHONE_PRIMARY = "8073762257";
export const PHONE_SECONDARY = "9110424403";

export const ACADEMY = "Rest Coder Academy";
export const HANDLE = "@restcoderacademy";

/* Transcribed from design/tokens.css so a graphic and a page cannot drift.
 * `cyan` has no token because it appears on graphics only — the batch-launch
 * accent — and adding it to the site's palette would imply the UI may use it. */
export const COLOR = {
  navy: "#03084C",
  navyDeep: "#01062F",
  blue: "#146389",
  blueDeep: "#10506F",
  cyan: "#22D3EE",
  orange: "#FF9800",
  ink: "#333333",
  white: "#FFFFFF",
  paper: "#F8FAFB",
};

export const FONT = "Montserrat, 'Segoe UI', system-ui, sans-serif";

/* Instagram's feed post. The other surfaces (story, Reel cover) crop from the
 * centre of this, which is why nothing meaningful sits in the outer 96px. */
export const CANVAS = { w: 1080, h: 1080 };
export const SAFE = 96;

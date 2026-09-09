import PropTypes from "prop-types";

/**
 * Per-route Open Graph and Twitter tags (#73).
 *
 * The problem this fixes: `index.html` carries one static set of social tags
 * with the homepage's title, description and URL, and nothing in `src/` ever
 * overrode them. So all 17 routes served the homepage's card — share a course
 * page or a blog post on WhatsApp or LinkedIn and the preview showed the
 * homepage title and a link that resolved to the front door.
 *
 * Every page already sets its own `<title>`, description and canonical this
 * way, so this follows that pattern rather than introducing a head library:
 * React 19 hoists these into `<head>`, and `scripts/prerender.mjs` keeps the
 * last of each so the static build ends up with exactly one.
 *
 * `url` should be the same absolute URL the page gives its canonical — a card
 * pointing somewhere other than the canonical is the bug this file exists to
 * fix, so they are deliberately the same value.
 */
const IMAGE = "https://restcoderacademy.in/og-card.png";

function SocialMeta({ title, description, url, type = "website" }) {
  return (
    <>
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={IMAGE} />
      {/* Both are required for the card to render at full width on LinkedIn
          and X; without them some crawlers fall back to a small thumbnail. */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:locale" content="en_IN" />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={IMAGE} />
    </>
  );
}

SocialMeta.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  url: PropTypes.string.isRequired,
  /** "article" on a blog post, "website" everywhere else. */
  type: PropTypes.oneOf(["website", "article"]),
};

export default SocialMeta;

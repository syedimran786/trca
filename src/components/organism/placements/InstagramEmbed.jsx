import { useEffect, useRef } from "react";

/**
 * Proof-of-concept for the placement Instagram embed layer described in
 * issue #145 (canonical scope in the 2026-09-07 comment). When a placement
 * record on the site has an `instagram_url` — the URL of a specific post or
 * Reel on @restcoderacademy — this component renders IG's official embed
 * inline in place of the photo+name+company card.
 *
 * Why an embed and not a screenshot: RCA's biggest social-proof moat is the
 * verifiability of each named placement. An embed carries the real caption,
 * the real like count, the real IG branding — a prospect can click through
 * to the actual post and verify. A screenshot could be faked; an embed can't.
 *
 * IG's `embed.js` is ~250KB and initialises the DOM by scanning for
 * `.instagram-media` blockquotes. It is loaded here lazily via an
 * IntersectionObserver so it never touches page load — only when this
 * component enters (or nearly enters) the viewport does the script get
 * inserted. Once loaded, subsequent embeds on the same page reuse the same
 * global (`window.instgrm.Embeds.process()` re-scans the DOM).
 *
 * Failure modes handled explicitly (per the ticket comment):
 *   - Script fails to load (network error, IG down)  → the blockquote's
 *     fallback anchor stays visible, taking the viewer to the post on IG.
 *   - Post has been deleted from IG (404)            → IG renders its own
 *     "Post unavailable" placeholder inside the iframe. Ugly but never a
 *     broken tile.
 *   - `prefers-reduced-motion` set                   → we don't autoplay
 *     anything; IG's embed itself does not autoplay Reels either.
 *
 * The component never removes the script tag or the global — treating them
 * as page-lifecycle singletons is intentional. Re-mounting the component
 * just re-observes the viewport intersection and calls process() again.
 */

// Module-level singletons so the script loads exactly once per page even if
// multiple embed components mount (four placement cards in the carousel, for
// example). A boolean flag alone is not enough — two components mounting
// simultaneously would both try to insert the script tag. The promise makes
// the second caller await the first.
let scriptPromise = null;

function loadInstagramEmbedScript() {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    // If the script tag is somehow already in the DOM (a plugin, or a hot
    // reload) reuse it rather than double-loading.
    const existing = document.querySelector('script[src*="instagram.com/embed.js"]');
    if (existing) {
      resolve();
      return;
    }
    const s = document.createElement("script");
    s.async = true;
    s.src = "https://www.instagram.com/embed.js";
    s.onload = () => resolve();
    // Silent resolve on error — the blockquote's anchor fallback covers the
    // viewer either way. Logging would just add noise for a class of failure
    // (adblockers, network hiccups) that isn't actionable.
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
  return scriptPromise;
}

export default function InstagramEmbed({ url, alumnusName }) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!url || !containerRef.current) return;

    let cancelled = false;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) return;
        observer.disconnect();
        loadInstagramEmbedScript().then(() => {
          if (cancelled) return;
          // process() is idempotent per blockquote — safe to call on
          // remount, safe to call before the script has replaced other
          // instances on the same page.
          if (window.instgrm && window.instgrm.Embeds && window.instgrm.Embeds.process) {
            window.instgrm.Embeds.process();
          }
        });
      },
      // Start loading slightly before the element scrolls into view so the
      // viewer sees the embed already partially rendered by the time they
      // reach the carousel. 200px matches the pattern used in FloatingIcons.
      { rootMargin: "200px" },
    );

    observer.observe(containerRef.current);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [url]);

  if (!url) return null;

  return (
    <blockquote
      ref={containerRef}
      className="instagram-media"
      data-instgrm-permalink={url}
      data-instgrm-version="14"
      // The min-width matches IG's own recommended minimum. Without it the
      // slick carousel item can collapse the embed to zero width during the
      // brief moment before the script processes it.
      style={{
        background: "#FFF",
        border: 0,
        borderRadius: "3px",
        boxShadow: "0 0 1px 0 rgba(0,0,0,0.5), 0 1px 10px 0 rgba(0,0,0,0.15)",
        margin: "0 auto",
        maxWidth: "540px",
        minWidth: "280px",
        padding: 0,
        width: "100%",
      }}
    >
      {/* Fallback content, visible while the script is loading or if it
          fails to load entirely. The link is the whole point — a viewer who
          can't see the embed can still click through and verify the post
          themselves. */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "#FFFFFF",
          lineHeight: "0",
          padding: "0 0",
          textAlign: "center",
          textDecoration: "none",
          width: "100%",
          display: "block",
        }}
      >
        See {alumnusName ? `${alumnusName}'s placement` : "this placement"} on Instagram
      </a>
    </blockquote>
  );
}

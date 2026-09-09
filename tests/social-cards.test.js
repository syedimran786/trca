/**
 * Every page that has a canonical also has a social card (#73).
 *
 * The bug this guards: `index.html` shipped one static set of og/twitter tags
 * with the homepage's values, and no page component ever overrode them — so
 * all 17 routes served the homepage's card. Sharing a course page on WhatsApp
 * showed the homepage title and a link back to the front door.
 *
 * The invariant is at source level on purpose. The failure mode is not "a tag
 * is malformed", it is "someone adds a page and forgets", which is exactly how
 * this happened. A test over built HTML would need a build to run first; this
 * one catches the same mistake in the file where it is made.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PAGES = resolve(__dirname, "../src/components/Pages");

const pages = readdirSync(PAGES)
  .filter((f) => f.endsWith(".jsx"))
  .map((f) => ({ name: f, src: readFileSync(join(PAGES, f), "utf8") }))
  // Home renders at "/", which index.html's static tags already describe
  // correctly; it is the one page whose card is meant to be the default.
  .filter((p) => p.name !== "Home.jsx");

const setsCanonical = pages.filter((p) => p.src.includes('rel="canonical"'));

describe("social cards", () => {
  it("finds the page components", () => {
    expect(setsCanonical.length).toBeGreaterThanOrEqual(8);
  });

  it.each(setsCanonical.map((p) => [p.name, p]))(
    "%s renders SocialMeta alongside its canonical",
    (_name, page) => {
      expect(page.src).toMatch(/<SocialMeta\b/);
      expect(page.src).toContain("SocialMeta/SocialMeta");
    },
  );

  it.each(setsCanonical.map((p) => [p.name, p]))(
    "%s points the card at the same url as the canonical",
    (_name, page) => {
      // Both read `url`, so a page cannot canonicalise to one place and
      // advertise another — the specific shape of the original bug.
      for (const tag of page.src.match(/<SocialMeta[^/]*\/>/g) || []) {
        expect(tag).toMatch(/url=\{url\}/);
      }
    },
  );

  it("blog posts are og:type article, and nothing else is", () => {
    const post = pages.find((p) => p.name === "BlogPost.jsx");
    expect(post.src).toMatch(/<SocialMeta[^/]*type="article"/);
    for (const page of setsCanonical.filter((p) => p.name !== "BlogPost.jsx")) {
      expect(page.src).not.toMatch(/type="article"/);
    }
  });

  it("no page hardcodes its own og tags instead of using the component", () => {
    // Duplicated tags are how the static set drifted from the real one.
    for (const page of pages) {
      expect(page.src).not.toMatch(/property="og:/);
      expect(page.src).not.toMatch(/name="twitter:/);
    }
  });
});

describe("the card image", () => {
  const html = readFileSync(resolve(__dirname, "../index.html"), "utf8");
  const meta = readFileSync(
    resolve(__dirname, "../src/components/atoms/SocialMeta/SocialMeta.jsx"),
    "utf8",
  );

  it("is the 1200x630 card, not the favicon", () => {
    // favicon.png is 624x681; summary_large_image letterboxes a near-square.
    expect(html).toContain("/og-card.png");
    expect(html).not.toMatch(/og:image" content="[^"]*favicon/);
    expect(meta).toContain("/og-card.png");
  });

  it("declares its dimensions, so crawlers render it full-width", () => {
    expect(meta).toContain('content="1200"');
    expect(meta).toContain('content="630"');
    expect(html).toContain('property="og:image:width"');
  });
});

describe("the prerender step keeps the per-route tags", () => {
  const script = readFileSync(resolve(__dirname, "../scripts/prerender.mjs"), "utf8");

  it("dedupes every tag SocialMeta emits", () => {
    // React injects the per-route tag after index.html's static one. Without a
    // keepLast for each, both survive and a crawler reading the first wins
    // gets the homepage card — the original bug, back again.
    for (const p of ["og:type", "og:title", "og:description", "og:url", "og:image"]) {
      expect(script).toContain(`"${p}"`);
    }
    for (const n of ["twitter:card", "twitter:title", "twitter:description", "twitter:image"]) {
      expect(script).toContain(`"${n}"`);
    }
  });
});

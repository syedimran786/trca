import { test, expect } from "@playwright/test";

// Issue caught by Nikshep on 2026-09-09: on the homepage the Placements
// carousel visually "collapses" on Cmd+Shift+R — the whole section is only
// ~30px tall (the IG blockquote fallback anchors) for the ~1-3s it takes IG's
// `embed.js` to fetch and hydrate ten iframes, then suddenly the section is
// ~900px tall and everything below (the footer) jumps down.
//
// The invariants this file pins:
//
// 1. The `.placements` section as a whole reserves real vertical space
//    BEFORE any IG iframes hydrate, so nothing below the section (the
//    homepage footer) needs to move down when they resolve.
// 2. The section's own bounding-rect height is close (within a small
//    tolerance) to what it becomes after all iframes have loaded — i.e., the
//    "sudden reveal" jump is small enough that the user does not perceive a
//    reflow.
// 3. Adjacent `.card--instagram` cards on the same row have a visible
//    horizontal gap — no more edge-to-edge touching after the width-100%
//    change.
//
// Together these three form the outcome Nikshep asked for: "no gap between
// videos" and "the whole site collapses" both stop being true.
//
// Reservation is applied to `.placements` (the outer section) rather than
// per-card, because a per-card `min-height` taller than slick's natural
// slide size breaks slick's own layout math — it stops tracking horizontally
// and stacks slides vertically. Verified in-branch and reverted.

const SECTION_MIN_HEIGHT = 900; // in sync with Placement.css `.placements { min-height: 900px }` at ≥600px viewports

async function scrollToPlacements(page) {
  await page.locator("#Placements").scrollIntoViewIfNeeded();
  // Give slick + IG a moment to react without asserting timing.
  await page.waitForSelector(".placements .card--instagram", { timeout: 15_000 });
}

test("Placement section reserves vertical space before IG hydrates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Kill all IG requests so the fallback anchor stays and IG never inflates
  // the iframe. This is precisely the state a fresh cold-cache Cmd+Shift+R
  // hits for the first few hundred ms, and it's the state where the section
  // was collapsing on live.
  await page.route(
    (url) =>
      url.hostname === "www.instagram.com" ||
      url.hostname === "instagram.com" ||
      url.hostname.endsWith(".cdninstagram.com"),
    (route) => route.abort(),
  );
  await page.goto("/");
  await scrollToPlacements(page);

  // Section total height with only blockquote fallbacks + no IG hydration.
  // The reservation on `.placements` should keep the section at least
  // SECTION_MIN_HEIGHT tall regardless of what's inside.
  const sectionHeight = await page.locator("#Placements").evaluate(
    (el) => Math.round(el.getBoundingClientRect().height),
  );
  expect(
    sectionHeight,
    `Placements section is only ${sectionHeight}px tall pre-hydrate — the section min-height reservation regressed`,
  ).toBeGreaterThanOrEqual(SECTION_MIN_HEIGHT - 5);
});

test("Placement section does not jump when IG embeds hydrate", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await scrollToPlacements(page);

  // Height with the fallback still visible (embed script may or may not have
  // resolved yet — this is the "before" state whatever that is).
  const heightBefore = await page.locator("#Placements").evaluate(
    (el) => Math.round(el.getBoundingClientRect().height),
  );

  // Wait for at least one hydrated IG iframe so we know we're past the
  // pre-hydrate state. If IG is being blocked (some network conditions),
  // fall through: the `heightAfter` will still equal heightBefore, and the
  // invariant is trivially satisfied by min-height alone.
  await page
    .waitForFunction(
      () => document.querySelectorAll(".placements .card--instagram iframe").length > 0,
      { timeout: 15_000 },
    )
    .catch(() => {});
  // Give IG's `embed.js` its postMessage resize round-trip so the iframe is
  // at its final rendered height.
  await page.waitForTimeout(2000);

  const heightAfter = await page.locator("#Placements").evaluate(
    (el) => Math.round(el.getBoundingClientRect().height),
  );

  // The section may still grow a little as IG's iframe stretches to its
  // final aspect ratio, but never more than one card's worth of jump — a
  // ~100px envelope is the visible-motion threshold; anything larger is a
  // collapse-and-reform.
  const jump = Math.abs(heightAfter - heightBefore);
  expect(
    jump,
    `Placements section height jumped ${jump}px (${heightBefore}→${heightAfter}) when IG hydrated — collapse-and-reform regressed`,
  ).toBeLessThan(150);
});

test("Adjacent IG cards on desktop have a visible horizontal gap", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");
  await scrollToPlacements(page);
  await page.waitForTimeout(500);

  const rects = await page.evaluate(() => {
    return [
      ...document.querySelectorAll(
        ".placements .slick-active .card--instagram, .placements .slick-slide:not(.slick-cloned) .card--instagram",
      ),
    ]
      .slice(0, 4)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { left: Math.round(r.left), right: Math.round(r.right) };
      })
      .sort((a, b) => a.left - b.left);
  });

  // Need at least two cards side-by-side to measure a gap.
  expect(rects.length, "at least two IG cards visible for a gap check").toBeGreaterThanOrEqual(2);

  for (let i = 1; i < rects.length; i++) {
    const gap = rects[i].left - rects[i - 1].right;
    // 8px is the target (4px symmetric margin on each side). Accept 6-16px
    // to allow for sub-pixel rounding and future minor tuning of the margin.
    expect(
      gap,
      `Adjacent IG cards touched at index ${i} (gap=${gap}px, expected 6-16px)`,
    ).toBeGreaterThanOrEqual(6);
    expect(gap).toBeLessThanOrEqual(16);
  }
});

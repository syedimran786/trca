import { test, expect } from "@playwright/test";
import {
  blockInstagram,
  scrollToPlacements,
  stubInstagram,
  waitForStubbedEmbeds,
} from "./fixtures/instagram.js";

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

// The card is `width: calc(100% - 8px)` with `margin: 0 4px`, so it sits 4px
// inside its slide on each side and two adjacent slides put 8px between their
// cards. See the block in Placement.css that #177 added.
const CARD_INSET = 4;

test("Placement section reserves vertical space before IG hydrates", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  // Kill all IG requests so the fallback anchor stays and IG never inflates
  // the iframe. This is precisely the state a fresh cold-cache Cmd+Shift+R
  // hits for the first few hundred ms, and it's the state where the section
  // was collapsing on live.
  await blockInstagram(page);
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
  // The two states are measured in two separate loads rather than before and
  // after within one.
  //
  // Taking "before" from a live page was the single flakiest thing in this
  // suite: it landed at an arbitrary point in IG's async hydration, so it was
  // sometimes the pre-hydrate height and sometimes the post-hydrate one. When
  // it landed early and IG was slow, this test reported an 8359px jump
  // (900→9259) on a commit that had touched none of this. Two loads make each
  // state exact.
  const heightWith = async (setup) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await setup(page);
    await page.goto("/");
    await scrollToPlacements(page);
    return page
      .locator("#Placements")
      .evaluate((el) => Math.round(el.getBoundingClientRect().height));
  };

  // Never hydrates: the fallback anchors only, which is the cold-cache state.
  const heightBefore = await heightWith(blockInstagram);

  await page.unrouteAll();

  // Fully hydrated, including the post-resize settle.
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubInstagram(page);
  await page.goto("/");
  await scrollToPlacements(page);
  await waitForStubbedEmbeds(page);
  const heightAfter = await page
    .locator("#Placements")
    .evaluate((el) => Math.round(el.getBoundingClientRect().height));

  // The section may still grow a little as the iframe stretches to its final
  // height, but never more than one card's worth of jump — a ~100px envelope
  // is the visible-motion threshold; anything larger is a collapse-and-reform.
  const jump = Math.abs(heightAfter - heightBefore);
  expect(
    jump,
    `Placements section height jumped ${jump}px (${heightBefore}→${heightAfter}) when IG hydrated — collapse-and-reform regressed`,
  ).toBeLessThan(150);
});

test("Adjacent IG cards on desktop have a visible horizontal gap", async ({ page }) => {
  // Measured as the card's inset within its own slide, not as the distance
  // between two IG cards.
  //
  // The previous version selected `.slick-active .card--instagram` plus the
  // un-cloned ones and required two of them. There is only ever **one**
  // un-cloned IG card on this page — the rest of that count came from slick's
  // own clones — so the test was measuring a card against copies of itself,
  // and whether it found two at all depended on where the carousel happened
  // to have settled. It failed locally with a count of one while passing in
  // CI on the same commit.
  //
  // The inset is the actual invariant #177 introduced, it is what produces
  // the 8px between neighbours, and it holds no matter how many placements
  // come back with an instagram_url.
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubInstagram(page);
  await page.goto("/");
  await scrollToPlacements(page);
  await waitForStubbedEmbeds(page);

  const geom = await page.evaluate(() => {
    const card = document.querySelector(
      ".placements .slick-slide:not(.slick-cloned) .card--instagram",
    );
    const slide = card && card.closest(".slick-slide");
    if (!card || !slide) return null;
    const c = card.getBoundingClientRect();
    const s = slide.getBoundingClientRect();
    return {
      leftInset: Math.round(c.left - s.left),
      rightInset: Math.round(s.right - c.right),
      cardWidth: Math.round(c.width),
      slideWidth: Math.round(s.width),
    };
  });

  expect(geom, "an un-cloned IG card inside a slick slide").not.toBeNull();

  // Symmetric, so the gap does not lean to one side the way the original
  // `margin-left: 8px` did.
  expect(
    geom.leftInset,
    `IG card is inset ${geom.leftInset}px on the left, expected ${CARD_INSET}px`,
  ).toBe(CARD_INSET);
  expect(
    geom.rightInset,
    `IG card is inset ${geom.rightInset}px on the right, expected ${CARD_INSET}px`,
  ).toBe(CARD_INSET);

  // Which is to say the card is exactly 8px narrower than its slide, so two
  // adjacent slides put 8px between their cards.
  expect(geom.slideWidth - geom.cardWidth).toBe(CARD_INSET * 2);
});

test("adjacent placement cards do not touch", async ({ page }) => {
  // The end-to-end version of the check above, across whatever cards the
  // carousel actually renders. Any `.card`, not only the IG variant, since
  // the row is mixed and the complaint was about the row.
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubInstagram(page);
  await page.goto("/");
  await scrollToPlacements(page);
  await waitForStubbedEmbeds(page);

  const gaps = await page.evaluate(() => {
    // Clones excluded deliberately. Slick duplicates the whole set on both
    // sides of the track for its infinite mode, and those copies sit far off
    // screen — the boundary between the clone group and the real one measures
    // ~301px, which is slick's track arithmetic rather than anything a viewer
    // can see. Only the un-cloned slides are on screen.
    const cards = [
      ...document.querySelectorAll(".placements .slick-slide:not(.slick-cloned) .card"),
    ]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0)
      .sort((a, b) => a.left - b.left);
    const out = [];
    for (let i = 1; i < cards.length; i++) {
      // Only compare cards sitting on the same row.
      if (Math.abs(cards[i].top - cards[i - 1].top) > 2) continue;
      out.push(Math.round(cards[i].left - cards[i - 1].right));
    }
    return out;
  });

  expect(gaps.length, "at least one adjacent pair on a row").toBeGreaterThan(0);
  for (const gap of gaps) {
    // The band is wider than the IG card's own 8px because the two variants
    // are deliberately different widths: the standard card is `94%` with a
    // `margin-left`, giving ~17px, while the IG variant is
    // `calc(100% - 8px)` so the embed gets every pixel it can (the reasoning
    // is in Placement.css). Both are intentional, so this test pins the thing
    // that was actually wrong — cards touching — rather than freezing a
    // gutter inconsistency it did not cause and should not hide.
    expect(gap, `adjacent cards touched (gap=${gap}px)`).toBeGreaterThanOrEqual(6);
    expect(gap, `adjacent cards drifted far apart (gap=${gap}px)`).toBeLessThanOrEqual(24);
  }
});

import { test, expect } from "@playwright/test";
import {
  IG_MIN_WIDTH,
  scrollToPlacements,
  stubInstagram,
  waitForStubbedEmbeds,
} from "./fixtures/instagram.js";

// Issue: on the homepage `Placements` carousel, Kota Akshay's Instagram-embed
// variant card was clipping IG's chrome (username row, "GOT PLACED FOR" banner,
// comment box) on both sides. Root cause: IG's `embed.js` forces
// `.instagram-media { min-width: 326px }` and writes a `width="326"` attribute
// on the resulting iframe. Any slick slide narrower than 326px was clipping
// IG's content via `.card--instagram { overflow: hidden }`.
//
// The invariant worth pinning here is not "the fix is 100% width" — that
// would just re-express the CSS. The invariant is the *outcome*: **the
// rendered IG iframe fits entirely within its enclosing card at every
// breakpoint where the carousel shows more than one slide**. If a future
// regression widens the iframe, breaks the width override, or changes slick
// to a size where 326px would fit again but IG rev'd its embed to 400px,
// these tests fire.
//
// Runs at four viewports covering all four responsive branches of the slick
// carousel (`slidesToShow`: 4 at ≥1024, 3 at ≥768, 2 at ≥600, 1 at ≥480).

const VIEWPORTS = [
  { name: "mobile-360", width: 360, height: 800, slidesToShow: 1 },
  { name: "mobile-480", width: 480, height: 800, slidesToShow: 2 },
  { name: "tablet-768", width: 768, height: 1024, slidesToShow: 3 },
  { name: "desktop-1440", width: 1440, height: 900, slidesToShow: 4 },
];

// The embed is stubbed rather than fetched. See ./fixtures/instagram.js — the
// stub applies IG's `min-width: 326px` stylesheet and its `width="326"`
// presentation attribute every single run, which is the hostile input these
// tests exist to prove our CSS beats. Waiting on the real script made the
// outcome depend on IG's response time instead.
//
// One intersection is enough for all of them: `InstagramEmbed.jsx` loads the
// script once per page, and `process()` then scans every blockquote in the
// DOM. So there is no carousel-advancing loop here any more — that loop was
// clicking a "next" arrow up to twelve times with the failure swallowed,
// which quietly did nothing whenever the arrow was not where it expected.
async function bringKotaIntoView(page) {
  await scrollToPlacements(page);
  await waitForStubbedEmbeds(page);
  await page.waitForSelector(".placements .slick-active .card--instagram iframe", {
    timeout: 15_000,
  });
}

async function measure(page) {
  return page.evaluate(() => {
    const card = document.querySelector(
      ".placements .slick-active .card--instagram",
    );
    const iframe = card?.querySelector("iframe");
    const blockquote = card?.querySelector(".instagram-media");
    if (!card || !iframe) return { missing: true };
    const cardRect = card.getBoundingClientRect();
    const iframeRect = iframe.getBoundingClientRect();
    const bqStyle = blockquote ? getComputedStyle(blockquote) : null;
    const iframeStyle = getComputedStyle(iframe);
    return {
      card: { left: cardRect.left, right: cardRect.right, width: cardRect.width },
      iframe: {
        left: iframeRect.left,
        right: iframeRect.right,
        width: iframeRect.width,
      },
      blockquoteMinWidth: bqStyle ? bqStyle.minWidth : null,
      iframeMinWidth: iframeStyle.minWidth,
      overflowLeft: Math.max(0, cardRect.left - iframeRect.left),
      overflowRight: Math.max(0, iframeRect.right - cardRect.right),
    };
  });
}

for (const vp of VIEWPORTS) {
  test(`Instagram embed fits inside its card at ${vp.name}`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await stubInstagram(page);
    await page.goto("/");
    await bringKotaIntoView(page);

    const m = await measure(page);
    expect(m.missing, "IG card + iframe should be present").not.toBe(true);

    // The two pixel-honest asserts. Anything > 0 here is the exact clipping
    // Nikshep flagged on live.
    expect(m.overflowLeft, "iframe must not protrude past the card on the left").toBeLessThanOrEqual(1);
    expect(m.overflowRight, "iframe must not protrude past the card on the right").toBeLessThanOrEqual(1);

    // Belt and braces: the iframe's width should never exceed the card's
    // width by more than a rounding pixel. Guards the "IG bumped their min
    // to 400px" hypothetical too.
    expect(m.iframe.width).toBeLessThanOrEqual(m.card.width + 1);
  });
}

test("IG's blockquote and iframe min-width overrides are actually applied", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await stubInstagram(page);
  await page.goto("/");
  await bringKotaIntoView(page);
  const m = await measure(page);
  // If someone later removes the min-width override thinking it's dead CSS,
  // IG's own stylesheet re-imposes `min-width: 326px` and the outcome tests
  // above start failing at every viewport under desktop 4-up. This test
  // catches the root-cause removal directly so the failure message is
  // "you removed the min-width override" rather than "the iframe is 37px
  // wider than the card and we don't know why".
  expect(m.blockquoteMinWidth, "blockquote min-width should be 0 not 326px").toBe("0px");
  expect(m.iframeMinWidth, "iframe min-width should be 0 not 326px").toBe("0px");

  // Guard the guard. If the stub ever stopped applying IG's rule, the two
  // assertions above would pass against nothing and quietly stop defending
  // the override they exist for.
  const hostileRuleApplied = await page.evaluate(
    () => !!document.querySelector("style[data-ig-stub]"),
  );
  expect(hostileRuleApplied, "the stub must impose IG's own min-width rule").toBe(true);

  // And the iframe still carries IG's width attribute, which author
  // `!important` is what beats.
  const widthAttr = await page.evaluate(
    () =>
      document
        .querySelector(".placements .slick-active .card--instagram iframe")
        ?.getAttribute("width"),
  );
  expect(Number(widthAttr)).toBe(IG_MIN_WIDTH);
});

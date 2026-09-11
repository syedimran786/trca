// Instagram, made deterministic for the e2e suite.
//
// Every test in placement-ig-embed and placement-carousel-stability used to
// wait on the real `instagram.com/embed.js` and on real iframes hydrating from
// IG's CDN. That made the whole E2E job a coin flip: three runs of one commit
// on 2026-09-09 gave a failure in placement-ig-embed, a failure in a different
// spec, and a pass, with nothing changed in between. One of those runs also
// took the wrangler dev server down with it, after which every remaining test
// failed with ERR_CONNECTION_REFUSED.
//
// None of those tests are about Instagram. They are about our CSS surviving
// Instagram: whether our `min-width: 0 !important` beats IG's `min-width:
// 326px`, whether the iframe reflows to the card instead of being clipped by
// `overflow: hidden`, and whether the section's height reservation absorbs
// hydration. All of that can be asserted against a stub — and asserted
// *better*, because the stub always applies the hostile behaviour, where the
// real script only sometimes got far enough to apply it.
//
// So the stub is written to be adversarial on purpose. It reproduces the three
// things IG does that our CSS has to defeat:
//
//   1. injects a stylesheet with `.instagram-media { min-width: 326px }`
//   2. renders an iframe carrying `width="326"` as a presentation attribute
//   3. grows that iframe's height a beat later, the way IG's postMessage
//      resize does
//
// If someone deletes the override in Placement.css, these tests now fail every
// time rather than whenever IG happened to be quick.

/** Every host the placement embeds would otherwise reach. */
const IG_HOSTS = (url) =>
  url.hostname === "www.instagram.com" ||
  url.hostname === "instagram.com" ||
  url.hostname.endsWith(".cdninstagram.com");

// What IG's own stylesheet imposes, and the width attribute it writes. Kept
// here as named constants because they are the adversarial input: if IG ever
// moves to 400px, changing these two numbers is the whole update.
export const IG_MIN_WIDTH = 326;
export const IG_IFRAME_HEIGHT = 540;

const STUB_SCRIPT = `
(function () {
  var MIN_WIDTH = ${IG_MIN_WIDTH};
  var HEIGHT = ${IG_IFRAME_HEIGHT};

  // (1) IG ships its own stylesheet. This is the rule our Placement.css has
  // to beat; without it the test would pass against a stub even if the
  // override were deleted.
  var style = document.createElement('style');
  style.setAttribute('data-ig-stub', '1');
  style.textContent =
    '.instagram-media { min-width: ' + MIN_WIDTH + 'px; max-width: 540px; }';
  document.head.appendChild(style);

  function render(bq) {
    if (bq.getAttribute('data-ig-stub-done')) return;
    bq.setAttribute('data-ig-stub-done', '1');

    // (2) IG replaces the blockquote with an iframe that keeps the
    // .instagram-media class and carries width as a presentation attribute.
    var iframe = document.createElement('iframe');
    iframe.className = 'instagram-media instagram-media-rendered';
    iframe.setAttribute('width', String(MIN_WIDTH));
    iframe.setAttribute('height', String(HEIGHT));
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('scrolling', 'no');
    iframe.setAttribute('data-instgrm-payload-id', 'stub');
    iframe.setAttribute('title', 'Instagram embed (stubbed)');
    // about:blank never touches the network, so the iframe is instant and
    // cannot flake. Nothing under test reads its contents.
    iframe.src = 'about:blank';
    iframe.style.height = Math.round(HEIGHT / 2) + 'px';

    bq.parentNode.insertBefore(iframe, bq);
    bq.parentNode.removeChild(bq);

    // (3) IG's embed measures its content and posts a resize back, so the
    // iframe's final height arrives after layout has already settled once.
    // That second settle is exactly what the "does not jump" test exists to
    // catch, so the stub has to do it too.
    requestAnimationFrame(function () {
      iframe.style.height = HEIGHT + 'px';
      iframe.setAttribute('data-ig-stub-settled', '1');
    });
  }

  function process() {
    var list = document.querySelectorAll('blockquote.instagram-media');
    for (var i = 0; i < list.length; i++) render(list[i]);
  }

  window.instgrm = { Embeds: { process: process } };
  process();
})();
`;

/**
 * Serve a stubbed `embed.js` and block every other Instagram request.
 *
 * Call before `page.goto`. The component loads the script lazily on
 * intersection, so nothing happens until the carousel is scrolled to, exactly
 * as in production.
 */
export async function stubInstagram(page) {
  await page.route(IG_HOSTS, (route) => {
    if (route.request().url().includes("/embed.js")) {
      return route.fulfill({
        status: 200,
        contentType: "application/javascript",
        body: STUB_SCRIPT,
      });
    }
    // Anything else the page reaches for (CDN images, the iframe document)
    // is not under test and must not become a network dependency.
    return route.abort();
  });
}

/**
 * Block Instagram outright, leaving the blockquote fallback in place.
 *
 * This is the cold-cache state a hard reload hits for the first few hundred
 * milliseconds, and the state the section used to collapse in.
 */
export async function blockInstagram(page) {
  await page.route(IG_HOSTS, (route) => route.abort());
}

/** Scroll the carousel into view and wait for the placement cards to exist. */
export async function scrollToPlacements(page) {
  await page.locator("#Placements").scrollIntoViewIfNeeded();
  await page.waitForSelector(".placements .card--instagram", { timeout: 15_000 });
}

/**
 * Wait until every stubbed embed has rendered *and* taken its post-resize
 * height, so a measurement cannot land between the two.
 */
export async function waitForStubbedEmbeds(page) {
  await page.waitForFunction(
    () => {
      const frames = document.querySelectorAll(
        ".placements .card--instagram iframe[data-instgrm-payload-id='stub']",
      );
      if (frames.length === 0) return false;
      return [...frames].every((f) => f.getAttribute("data-ig-stub-settled") === "1");
    },
    { timeout: 15_000 },
  );
}

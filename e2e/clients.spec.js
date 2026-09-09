import { test, expect } from "@playwright/test";

// Issue #169. Two regressions worth guarding, both of which shipped to
// production and neither of which any existing test would have caught.

test("the section says the companies are where students work, not clients", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const section = page.locator("#Clients");
  await expect(section.getByRole("heading", { name: /our students work at/i })).toBeVisible();

  // The old copy called Wipro, Infosys and Accenture clients of the academy.
  // They are companies students were placed at.
  await expect(section).not.toContainText(/trusted clients/i);
});

test("the logos are visible at tablet width", async ({ page }) => {
  // `.clients .card-content { opacity: 0 }` was scoped to 768-991.98px, so the
  // carousel still occupied full height and was still read by a screen reader
  // while being completely invisible. A visibility assertion passes against
  // opacity:0 — the computed value is what has to be checked.
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.goto("/");

  const content = page.locator("#Clients .card-content").first();
  await expect(content).toBeVisible();
  await expect(content).toHaveCSS("opacity", "1");
});

test("logos keep their aspect ratio instead of being cropped to a circle", async ({ page }) => {
  // The tile used border-radius: 50% with the image stretched to fill, which
  // cut the ends off the wider wordmarks.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  const logo = page.locator("#Clients .card-content img").first();
  await expect(logo).toHaveCSS("object-fit", "contain");
});

test("every visible logo renders at a consistent size", async ({ page }) => {
  // Nikshep on 2026-09-09: the row read as "jumbled" because each wordmark
  // rendered at its intrinsic aspect ratio — Mindtree at 47px, Accenture and
  // Wipro at 197px, others in between — producing a very uneven visual
  // rhythm across the tile row. The fix caps every image at max-height 70px,
  // which normalises visual weight. Guard the outcome, not the specific
  // number: every logo in the visible window should render within a small
  // envelope of every other one.
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/");

  // Only measure logos whose top-left is roughly inside the viewport; slick's
  // clones and off-screen slides can be at extreme negative x and their
  // heights are irrelevant to what a visitor sees.
  const visibleHeights = await page.evaluate(() => {
    return [...document.querySelectorAll("#Clients .card-content img")]
      .map((img) => {
        const r = img.getBoundingClientRect();
        return { h: Math.round(r.height), x: Math.round(r.left) };
      })
      .filter((r) => r.x >= -50 && r.x < window.innerWidth + 50 && r.h > 0)
      .map((r) => r.h);
  });

  expect(visibleHeights.length, "at least four logos visible").toBeGreaterThanOrEqual(4);
  const maxH = Math.max(...visibleHeights);
  const minH = Math.min(...visibleHeights);
  // Envelope: no logo should render more than 25px taller than any other in
  // the visible window. That's tight enough to catch a Mindtree-vs-Accenture
  // regression (150px difference on live before the fix) but loose enough to
  // allow the natural aspect-ratio variance within the 70px cap.
  expect(
    maxH - minH,
    `logo heights varied by ${maxH - minH}px (min ${minH}, max ${maxH}) — jumble regressed`,
  ).toBeLessThanOrEqual(25);
  // Also cap absolute size — 70px is the CSS value; anything much larger
  // means the CSS regression escaped.
  expect(maxH, "no logo should render taller than the CSS cap").toBeLessThanOrEqual(80);
});

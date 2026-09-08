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

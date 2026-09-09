// Post-build prerender. The app is a client-rendered React SPA, so crawlers get
// an empty <div id="root"> on first load. This snapshots each route to static
// HTML — using a real headless browser (Playwright), so no SSR-safety refactor
// is needed for the app's window/localStorage/Razorpay/modal code. The page's
// own JS still boots on load, so users get the normal live SPA; crawlers get the
// pre-rendered content + the per-route <title>/<meta>/JSON-LD React 19 injects.
//
// Runs in the deploy job only (needs chromium): `npm run build && npm run prerender`.
import { chromium } from "@playwright/test";
import { createServer } from "node:http";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, dirname, resolve } from "node:path";
import { courses } from "../src/components/organism/courses/courses.js";
import { posts } from "../src/components/Pages/blog/posts.js";

const DIST = resolve(process.cwd(), "dist");
const HOST = "127.0.0.1";

const routes = [
  { path: "/", out: "index.html", waitFor: "#Courses" },
  { path: "/for-parents", out: "for-parents.html", waitFor: "main.fp" },
  { path: "/placements", out: "placements.html", waitFor: "main.pl" },
  { path: "/contact", out: "contact.html", waitFor: "main.ct" },
  { path: "/faq", out: "faq.html", waitFor: "main.faq" },
  { path: "/blog", out: "blog.html", waitFor: "main.bl" },
  ...posts.map((p) => ({ path: `/blog/${p.slug}`, out: `blog/${p.slug}.html`, waitFor: "article.bl-post" })),
  // /about renders either the founder story (when /api/founder returns one) or
  // a school-level fallback. Both paths end in <main class="ab">, so the same
  // waitFor works. Snapshotting is essential — without a dist/about.html, CF
  // Pages served dist/index.html for /about, making it a byte-identical
  // duplicate of the homepage.
  { path: "/about", out: "about.html", waitFor: "main.ab" },
  ...courses.map((c) => {
    const slug = c.slug || c.courseId;
    // Flat `.html` (not `<slug>/index.html`) so Cloudflare Pages serves the
    // clean, no-trailing-slash URL directly (200) — matching the canonical +
    // sitemap and avoiding a 308 redirect hop.
    return { path: `/courses/${slug}`, out: `courses/${slug}.html`, waitFor: "main.cd" };
  }),
];

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".svg": "image/svg+xml", ".png": "image/png",
  ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif", ".webp": "image/webp",
  ".ico": "image/x-icon", ".woff": "font/woff", ".woff2": "font/woff2",
  ".ttf": "font/ttf", ".txt": "text/plain; charset=utf-8", ".xml": "application/xml",
  ".map": "application/json",
};

async function main() {
  if (!existsSync(join(DIST, "index.html"))) {
    console.error("prerender: dist/index.html not found — run `npm run build` first.");
    process.exit(1);
  }
  // Serve the ORIGINAL shell for every SPA route, from memory, so writing
  // prerendered files mid-run never changes what the server hands back.
  const shell = await readFile(join(DIST, "index.html"));

  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url, `http://${HOST}`);
      const rel = decodeURIComponent(url.pathname).replace(/^\/+/, "");
      const filePath = join(DIST, rel);
      // A real static asset (js/css/img/robots…) → serve it. Otherwise SPA shell.
      if (rel && extname(rel) && existsSync(filePath) && resolve(filePath).startsWith(DIST)) {
        const body = await readFile(filePath);
        res.writeHead(200, { "content-type": TYPES[extname(filePath)] || "application/octet-stream" });
        res.end(body);
        return;
      }
      res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
      res.end(shell);
    } catch (e) {
      res.writeHead(500);
      res.end(String(e));
    }
  });

  await new Promise((r) => server.listen(0, HOST, r));
  const port = server.address().port;
  const base = `http://${HOST}:${port}`;

  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Instagram embeds on /placements (see placement.js records with
  // `instagram_url`) load `embed.js` and one iframe per card from
  // instagram.com/www.cdninstagram.com. Those iframes keep the network
  // busy long after the SPA has finished rendering — a video prefetch here,
  // a metrics ping there — so `waitUntil: "networkidle"` was never reaching
  // idle inside the 30s timeout once the fallback list carried more than
  // one IG record. Abort every request to IG's origins during the snapshot;
  // InstagramEmbed's blockquote fallback anchor stays visible, which is
  // what a crawler should see anyway (a real link to the post, not an
  // opaque iframe), and the client-side script still runs on the real
  // page load for actual visitors. Same treatment for cdninstagram.com
  // (media) and platform-lookaside.fbsbx.com (avatar CDN) so no lingering
  // media request pins the network open.
  await page.route("**/*", (route) => {
    const host = new URL(route.request().url()).hostname;
    if (
      host === "www.instagram.com" ||
      host === "instagram.com" ||
      host.endsWith(".cdninstagram.com") ||
      host.endsWith(".fbsbx.com")
    ) {
      return route.abort();
    }
    return route.continue();
  });

  let ok = 0;

  for (const route of routes) {
    const target = base + route.path;
    // `waitUntil: "load"` fires after the SPA's scripts and stylesheets are
    // in, without waiting for arbitrarily-lingering third-party requests.
    // The `waitForSelector` below is what actually confirms the SPA rendered
    // the route's own content — the network-idle wait was double-insurance
    // that we no longer need, and which broke with IG embeds on the page.
    await page.goto(target, { waitUntil: "load", timeout: 30000 });
    await page.waitForSelector(route.waitFor, { timeout: 20000 });

    // React 19 hoists per-route <title>/<meta> into a <head> that already holds
    // the static ones from index.html — collapse each to a single element so the
    // page ends with exactly one canonical title/description.
    await page.evaluate(() => {
      // `document.title` is the effective title React 19 maintains (course title
      // on a course page, homepage title on home) — rebuild a single canonical
      // <title> from it, regardless of how many/where the elements ended up.
      const effectiveTitle = document.title;
      document.querySelectorAll("head > title").forEach((t) => t.remove());
      const t = document.createElement("title");
      t.textContent = effectiveTitle;
      document.head.appendChild(t);
      // For meta description + canonical, the per-route element React injects is
      // last, so keep the last of each.
      const keepLast = (sel) => {
        const els = [...document.querySelectorAll(sel)];
        els.slice(0, -1).forEach((e) => e.remove());
      };
      keepLast('head > meta[name="description"]');
      keepLast('head > link[rel="canonical"]');
      // Same for the social card (#73). index.html ships a static set with the
      // homepage's values; SocialMeta injects the per-route one after it. Without
      // this every page would serve two of each tag, and a crawler that reads the
      // first wins gets the homepage card again — the exact bug being fixed.
      [
        "og:type", "og:title", "og:description", "og:url",
        "og:image", "og:image:width", "og:image:height", "og:locale",
      ].forEach((p) => keepLast(`head > meta[property="${p}"]`));
      [
        "twitter:card", "twitter:title", "twitter:description", "twitter:image",
      ].forEach((n) => keepLast(`head > meta[name="${n}"]`));
    });

    const html = "<!doctype html>\n" + (await page.evaluate(() => document.documentElement.outerHTML));
    const outPath = join(DIST, route.out);
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, html);
    const title = (html.match(/<title>([^<]*)<\/title>/) || [])[1] || "(no title)";
    console.log(`prerendered ${route.path.padEnd(38)} → ${route.out}   [${title}]`);
    ok++;
  }

  await browser.close();
  await new Promise((r) => server.close(r));
  console.log(`prerender: ${ok}/${routes.length} routes written.`);
}

main().catch((e) => {
  console.error("prerender failed:", e);
  process.exit(1);
});

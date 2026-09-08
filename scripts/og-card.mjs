/**
 * Build public/og-card.png — the 1200x630 image every social card uses (#73).
 *
 *   node scripts/og-card.mjs
 *
 * Was `favicon.png`, a 624x681 logo. With `twitter:card = summary_large_image`
 * a near-square image gets letterboxed or centre-cropped, so a shared link
 * looked broken rather than designed. 1200x630 is the size Facebook, LinkedIn
 * and X all crop from cleanly.
 *
 * Generated rather than hand-made so it tracks design/tokens.css, and drawn
 * with the mark alone — the wordmark in the full lockup is unreadable once a
 * card is scaled to a WhatsApp thumbnail.
 */
import { chromium } from "playwright";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const NAVY = "#03084C";
const ORANGE = "#FF9800";
const FONT_DIR = resolve(ROOT, "node_modules/@fontsource/montserrat/files");
const face = (w) =>
  `@font-face{font-family:Montserrat;font-weight:${w};font-style:normal;` +
  `src:url("file://${FONT_DIR}/montserrat-latin-${w}-normal.woff2") format("woff2");}`;

const html = `<style>
  ${[500, 600, 700].map(face).join("")}
  html,body{margin:0;padding:0}
  .card{width:1200px;height:630px;background:${NAVY};color:#fff;
        font-family:Montserrat,system-ui,sans-serif;position:relative;
        display:flex;flex-direction:column;justify-content:center;
        padding:0 96px;box-sizing:border-box;overflow:hidden}
  /* A single wedge rather than a gradient: it survives the heavy JPEG
     recompression WhatsApp applies to link previews. */
  .wedge{position:absolute;right:0;top:0;width:420px;height:630px;
         background:#0A1270;transform:skewX(-12deg);transform-origin:top right}
  .mark{position:relative;width:96px;height:96px;border:4px solid #fff;
        border-radius:50%;display:flex;align-items:center;justify-content:center;
        font-size:52px;font-weight:700;margin-bottom:40px}
  h1{position:relative;font-size:66px;line-height:1.12;margin:0;font-weight:700;
     letter-spacing:-0.015em;max-width:820px}
  p{position:relative;font-size:30px;line-height:1.4;margin:28px 0 0;
    font-weight:500;color:#CDD6EA;max-width:760px}
  .rule{position:relative;width:120px;height:6px;background:${ORANGE};
        margin-top:44px;border-radius:3px}
</style>
<div class="card">
  <div class="wedge"></div>
  <div class="mark">R</div>
  <h1>Live full-stack coding classes in Bengaluru</h1>
  <p>Java, Python and MERN. Four months in a classroom, with placement support.</p>
  <div class="rule"></div>
</div>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: resolve(ROOT, "public/og-card.png"), clip: { x: 0, y: 0, width: 1200, height: 630 } });
await browser.close();
console.log("wrote public/og-card.png (1200x630)");

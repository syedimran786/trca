/**
 * Build the social templates to SVG, and optionally to PNG proofs (#151).
 *
 *   node design/social-templates/tools/build.mjs          # SVG only
 *   node design/social-templates/tools/build.mjs --png    # + 1080px PNGs
 *   node design/social-templates/tools/build.mjs --check  # CI: no dead URL
 *
 * SVG is the committed artefact because it diffs — the next time the domain,
 * a phone number or a layout changes, the review shows exactly what moved on
 * the graphic. PNG needs a browser and is only for eyeballing a proof, so it
 * is opt-in and not committed.
 */
import { mkdir, readdir, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SITE_URL } from "../brand.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");
const OUT = join(ROOT, "out");

/* The whole point of the ticket. If any of these ever appears in a built
   graphic again, --check fails rather than the post going out. */
const FORBIDDEN = [/restcoderacademy\.com/i, /www\.restcoderacademy/i, /https?:\/\/restcoderacademy/i];

const png = process.argv.includes("--png");
const checkOnly = process.argv.includes("--check");

async function templates() {
  const dir = join(ROOT, "templates");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".js") && !f.startsWith("_")).sort();
  return Promise.all(files.map((f) => import(join(dir, f))));
}

function audit(id, svg) {
  const hits = FORBIDDEN.filter((re) => re.test(svg)).map(String);
  if (hits.length) throw new Error(`${id}: dead-URL pattern in output → ${hits.join(", ")}`);
  if (!svg.includes(SITE_URL)) throw new Error(`${id}: no ${SITE_URL} watermark in output`);
}

const mods = await templates();
if (!mods.length) throw new Error("no templates found");

const built = mods.map((m) => {
  const svg = m.render();
  audit(m.meta.id, svg);
  return { ...m.meta, svg };
});

if (checkOnly) {
  console.log(`✓ ${built.length} templates carry ${SITE_URL} and no dead URL`);
  process.exit(0);
}

await mkdir(OUT, { recursive: true });
for (const t of built) {
  await writeFile(join(OUT, `${t.id}.svg`), t.svg);
  console.log(`svg  out/${t.id}.svg   (${t.title})`);
}

if (png) {
  // Playwright is already a devDependency for the e2e suite, so a proof export
  // needs no new tooling. Montserrat is loaded from the installed @fontsource
  // package rather than the network, so a proof rendered offline still uses
  // the real face instead of silently falling back to Helvetica.
  const { chromium } = await import("playwright");
  const fontDir = resolve(ROOT, "../../node_modules/@fontsource/montserrat/files");
  const face = (w) =>
    `@font-face{font-family:Montserrat;font-weight:${w};font-style:normal;src:url("file://${fontDir}/montserrat-latin-${w}-normal.woff2") format("woff2");}`;
  const css = [400, 500, 600, 700].map(face).join("");

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1080 }, deviceScaleFactor: 1 });
  for (const t of built) {
    await page.setContent(
      `<style>${css}html,body{margin:0;padding:0}svg{display:block}</style>${t.svg}`,
      { waitUntil: "load" },
    );
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: join(OUT, `${t.id}.png`), clip: { x: 0, y: 0, width: 1080, height: 1080 } });
    console.log(`png  out/${t.id}.png`);
  }
  await browser.close();
}

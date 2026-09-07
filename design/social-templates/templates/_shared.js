/**
 * Pieces every template shares (#151).
 *
 * The watermark is the whole point of the ticket: it is defined once, here,
 * and the three templates call it. A future TLD change cannot land on two
 * graphics and miss the third, because there is only one of them.
 */
import { COLOR, FONT, SITE_URL, CANVAS } from "../brand.js";

/** Text going into an SVG is untrusted the moment a testimonial is pasted in. */
export const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/**
 * Break a string into lines that fit `width` at `size`.
 *
 * SVG has no text wrapping, so a long testimonial would otherwise run off the
 * canvas — which is exactly how you get a graphic that looks fine in the
 * design tool and clipped on a phone. The 0.52 factor is Montserrat's rough
 * average advance width per em; it is approximate on purpose, because the
 * alternative is shipping a font-metrics dependency to lay out three posters.
 */
export function wrap(text, { size, width, maxLines = Infinity }) {
  const perChar = size * 0.52;
  const max = Math.max(1, Math.floor(width / perChar));
  const lines = [];
  let line = "";
  for (const word of String(text).split(/\s+/).filter(Boolean)) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length <= max) {
      line = candidate;
    } else {
      if (line) lines.push(line);
      line = word;
    }
  }
  if (line) lines.push(line);
  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    kept[maxLines - 1] = kept[maxLines - 1].replace(/[.,;:]?$/, "…");
    return kept;
  }
  return lines;
}

/** Multi-line <text>, since <tspan> dy is the only wrapping SVG offers. */
export function textBlock(lines, { x, y, size, fill, weight = 400, lh = 1.35, anchor = "start" }) {
  const spans = lines
    .map((l, i) => `<tspan x="${x}" dy="${i === 0 ? 0 : (size * lh).toFixed(1)}">${esc(l)}</tspan>`)
    .join("");
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="${weight}" fill="${fill}" text-anchor="${anchor}">${spans}</text>`;
}

/**
 * The URL watermark — the string #151 exists to correct.
 *
 * Every template renders this and none of them writes the domain itself, so
 * `SITE_URL` in brand.js is the only place the domain appears in this folder.
 */
export function watermark({ x, y, fill = COLOR.white, size = 26, anchor = "start", opacity = 0.92 }) {
  return `<text x="${x}" y="${y}" font-family="${FONT}" font-size="${size}" font-weight="600" fill="${fill}" fill-opacity="${opacity}" text-anchor="${anchor}" letter-spacing="0.4">${esc(SITE_URL)}</text>`;
}

/**
 * Where a real photograph is dropped in.
 *
 * A template ships without one — the portrait changes every post. Rendering a
 * labelled placeholder rather than nothing means the exported proof shows the
 * true composition instead of a hole, and whoever drops the photo in can see
 * the crop they have to fill.
 */
export function photoSlot({ x, y, w, h, r = 0, label = "PHOTO", clip = "" }) {
  return `
    <g${clip}>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${COLOR.paper}" fill-opacity="0.14"/>
      <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="none" stroke="${COLOR.white}" stroke-opacity="0.35" stroke-width="2" stroke-dasharray="10 8"/>
      <text x="${x + w / 2}" y="${y + h / 2}" font-family="${FONT}" font-size="22" font-weight="600" fill="${COLOR.white}" fill-opacity="0.6" text-anchor="middle" letter-spacing="3">${esc(label)}</text>
    </g>`;
}

/** The RCA mark, drawn rather than linked so a template file stands alone. */
export function logoMark({ x, y, size = 72, fg = COLOR.white, bg = "none" }) {
  const r = size / 2;
  return `
    <g transform="translate(${x} ${y})">
      <circle cx="${r}" cy="${r}" r="${r}" fill="${bg}" stroke="${fg}" stroke-opacity="0.9" stroke-width="2.5"/>
      <text x="${r}" y="${r}" dy="0.36em" font-family="${FONT}" font-size="${size * 0.52}" font-weight="700" fill="${fg}" text-anchor="middle">R</text>
    </g>`;
}

/** Defs first, then body — the order the templates read in. */
export const doc = (defs, body) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${CANVAS.w}" height="${CANVAS.h}" viewBox="0 0 ${CANVAS.w} ${CANVAS.h}" role="img">
  <defs>${defs}</defs>
${body}
</svg>
`;

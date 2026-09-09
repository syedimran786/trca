/**
 * Festival Greeting (#151).
 *
 * The lightest of the three: an illustrated field, the RCA mark top-right, a
 * decorative headline, and the watermark in the corner — which is the `.com`
 * this ticket corrects.
 *
 * The illustration is drawn here rather than linked because a greeting goes
 * out on a few hours' notice and nobody should have to go find an asset. Rays,
 * lamps and a border are enough to read as festive across Ugadi, Deepavali,
 * Sankranti and the rest, which is what a *recurring* template needs — one
 * that only worked for Deepavali would be redrawn every time and drift again.
 */
import { COLOR, FONT, ACADEMY, CANVAS, SAFE } from "../brand.js";
import { doc, esc, logoMark, textBlock, watermark, wrap } from "./_shared.js";

export const meta = {
  id: "festival-greeting",
  title: "Festival Greeting",
  fields: "occasion, greeting, message",
};

export const sample = {
  occasion: "Deepavali",
  greeting: "Happy Deepavali",
  message: "May this year bring you light, and the courage to start something new.",
};

/** Lamps along the lower edge. Count is fixed; the canvas never changes. */
function lamps(y) {
  const n = 7;
  const gap = (CANVAS.w - SAFE * 2) / (n - 1);
  return Array.from({ length: n }, (_, i) => {
    const x = SAFE + gap * i;
    const lift = i % 2 === 0 ? 0 : 26;
    return `
    <g transform="translate(${x.toFixed(1)} ${y - lift})">
      <path d="M -26 0 Q 0 34 26 0 Z" fill="${COLOR.orange}" fill-opacity="0.9"/>
      <ellipse cx="0" cy="0" rx="26" ry="6" fill="${COLOR.orange}"/>
      <path d="M 0 -4 Q -9 -20 0 -30 Q 9 -20 0 -4 Z" fill="${COLOR.white}" fill-opacity="0.95"/>
      <path d="M 0 -8 Q -5 -18 0 -24 Q 5 -18 0 -8 Z" fill="${COLOR.orange}"/>
    </g>`;
  }).join("");
}

export function render(d = sample) {
  const data = { ...sample, ...d };

  /* Rays from behind the headline. Angled from the top-right so they read as
     coming from the mark rather than from nowhere. */
  const rays = Array.from({ length: 16 }, (_, i) => {
    const a = (i * 360) / 16;
    return `<rect x="-3" y="-620" width="6" height="620" fill="${COLOR.white}" fill-opacity="0.05" transform="rotate(${a})"/>`;
  }).join("");

  return doc(
    `
    <radialGradient id="glow" cx="0.5" cy="0.42" r="0.72">
      <stop offset="0%" stop-color="${COLOR.blue}"/>
      <stop offset="70%" stop-color="${COLOR.navy}"/>
      <stop offset="100%" stop-color="${COLOR.navyDeep}"/>
    </radialGradient>`,
    `
  <rect width="${CANVAS.w}" height="${CANVAS.h}" fill="url(#glow)"/>
  <g transform="translate(540 470)">${rays}</g>

  <!-- Border, inset to the safe area so a story crop never clips it. -->
  <rect x="${SAFE / 2}" y="${SAFE / 2}" width="${CANVAS.w - SAFE}" height="${CANVAS.h - SAFE}" rx="18"
        fill="none" stroke="${COLOR.orange}" stroke-opacity="0.55" stroke-width="3"/>

  ${logoMark({ x: CANVAS.w - SAFE - 76, y: SAFE - 20, size: 76 })}

  <text x="540" y="352" font-family="${FONT}" font-size="30" font-weight="600" fill="${COLOR.orange}" text-anchor="middle" letter-spacing="7">${esc(String(data.occasion).toUpperCase())}</text>

  <!-- The headline. Wrapped rather than fixed at one line: "Happy Ganesh
       Chaturthi" is twice the width of "Happy Ugadi" and would otherwise run
       off both edges. -->
  ${textBlock(wrap(data.greeting, { size: 92, width: 830, maxLines: 2 }), {
    x: 540, y: 470, size: 92, weight: 700, fill: COLOR.white, lh: 1.12, anchor: "middle",
  })}

  <rect x="450" y="518" width="180" height="3" fill="${COLOR.orange}" fill-opacity="0.8"/>

  ${textBlock(wrap(data.message, { size: 32, width: 700, maxLines: 3 }), {
    x: 540, y: 592, size: 32, weight: 400, fill: COLOR.white, lh: 1.5, anchor: "middle",
  })}

  ${lamps(870)}

  <text x="${SAFE}" y="${CANVAS.h - SAFE + 14}" font-family="${FONT}" font-size="27" font-weight="600" fill="${COLOR.white}" fill-opacity="0.85">${esc(ACADEMY)}</text>
  ${watermark({ x: CANVAS.w - SAFE, y: CANVAS.h - SAFE + 14, anchor: "end", size: 27 })}`,
  );
}

/**
 * Placement Testimonial — the template RCA publishes most often (#151).
 *
 * Layout transcribed from the live graphics: blue gradient field, portrait
 * cropped hard to the right edge, the student's name and role over it, a
 * salary badge, the quote in the middle, and a bottom bar carrying the
 * college, the phones and the URL. The URL in that bar is the `.com` this
 * ticket corrects.
 */
import { COLOR, FONT, PHONE_PRIMARY, PHONE_SECONDARY, CANVAS, SAFE } from "../brand.js";
import { doc, esc, logoMark, photoSlot, textBlock, watermark, wrap } from "./_shared.js";

export const meta = {
  id: "placement-testimonial",
  title: "Placement Testimonial",
  fields: "name, designation, company, yop, salary, quote, college",
};

export const sample = {
  name: "Ashish Kumar",
  designation: "Software Engineer",
  company: "Infosys",
  yop: "2024",
  salary: "₹6.5 LPA",
  quote:
    "I joined with no coding background. The live projects and the mock interviews are what got me through the Infosys rounds.",
  college: "BMS College of Engineering",
};

export function render(d = sample) {
  const data = { ...sample, ...d };
  const barH = 132;
  const barY = CANVAS.h - barH;

  const quoteLines = wrap(data.quote, { size: 34, width: 560, maxLines: 5 });

  /* Centre the quote in the band between the salary pill and the bottom bar.
     Fixing the top instead left a short quote floating with a dead third of
     the canvas under it — which is what the first proof of this looked like. */
  const bandTop = 470;
  const quoteH = quoteLines.length * 34 * 1.45;
  const quoteTop = bandTop + Math.max(0, (barY - bandTop - quoteH) / 2);

  return doc(
    `
    <linearGradient id="field" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${COLOR.blue}"/>
      <stop offset="55%" stop-color="${COLOR.blueDeep}"/>
      <stop offset="100%" stop-color="${COLOR.navy}"/>
    </linearGradient>
    <linearGradient id="portraitFade" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="${COLOR.navy}" stop-opacity="0.95"/>
      <stop offset="45%" stop-color="${COLOR.navy}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="portraitClip"><rect x="620" y="0" width="460" height="${barY}"/></clipPath>`,
    `
  <rect width="${CANVAS.w}" height="${CANVAS.h}" fill="url(#field)"/>

  <!-- Portrait, bled to the right edge and to the bottom bar. The fade is what
       lets the name sit over the photo and stay readable whoever is in it. -->
  ${photoSlot({ x: 620, y: 0, w: 460, h: barY, label: "STUDENT PHOTO", clip: ' clip-path="url(#portraitClip)"' })}
  <rect x="620" y="0" width="260" height="${barY}" fill="url(#portraitFade)"/>

  ${logoMark({ x: SAFE, y: 72, size: 76 })}
  <text x="${SAFE + 96}" y="126" font-family="${FONT}" font-size="26" font-weight="600" fill="${COLOR.white}" fill-opacity="0.85" letter-spacing="4">PLACED</text>

  <!-- Name + role. Two lines, because "Senior Software Engineer" at a long
       company name is the normal case, not the exception. -->
  ${textBlock(wrap(data.name, { size: 62, width: 500, maxLines: 2 }), {
    x: SAFE, y: 268, size: 62, weight: 700, fill: COLOR.white, lh: 1.1,
  })}
  ${textBlock(wrap(`${data.designation}, ${data.company}`, { size: 32, width: 500, maxLines: 2 }), {
    x: SAFE, y: 336, size: 32, weight: 500, fill: COLOR.cyan, lh: 1.25,
  })}

  <!-- Salary and year of passing. A pill, so a blank salary collapses the
       badge instead of leaving a labelled empty box. -->
  ${
    data.salary
      ? `<g>
    <rect x="${SAFE}" y="386" width="${28 + String(data.salary).length * 21}" height="58" rx="29" fill="${COLOR.orange}"/>
    <text x="${SAFE + 20}" y="425" font-family="${FONT}" font-size="32" font-weight="700" fill="${COLOR.navy}">${esc(data.salary)}</text>
  </g>`
      : ""
  }
  <text x="${SAFE + (data.salary ? 40 + String(data.salary).length * 21 : 0)}" y="425" font-family="${FONT}" font-size="26" font-weight="500" fill="${COLOR.white}" fill-opacity="0.75">Y.O.P ${esc(data.yop)}</text>

  <!-- The quote. The oversized mark is decoration and is hidden from the
       accessible name, which the caption carries anyway. -->
  <text x="${SAFE - 6}" y="${quoteTop + 24}" font-family="${FONT}" font-size="150" font-weight="700" fill="${COLOR.white}" fill-opacity="0.16" aria-hidden="true">“</text>
  ${textBlock(quoteLines, { x: SAFE, y: quoteTop, size: 34, weight: 400, fill: COLOR.white, lh: 1.45 })}

  <!-- Bottom bar: college, phones, URL. -->
  <rect x="0" y="${barY}" width="${CANVAS.w}" height="${barH}" fill="${COLOR.navyDeep}"/>
  <rect x="0" y="${barY}" width="${CANVAS.w}" height="4" fill="${COLOR.orange}"/>
  ${textBlock(wrap(data.college, { size: 25, width: 620, maxLines: 2 }), {
    x: SAFE, y: barY + 52, size: 25, weight: 500, fill: COLOR.white, lh: 1.3,
  })}
  <text x="${CANVAS.w - SAFE}" y="${barY + 52}" font-family="${FONT}" font-size="25" font-weight="600" fill="${COLOR.white}" fill-opacity="0.9" text-anchor="end">${esc(PHONE_PRIMARY)} · ${esc(PHONE_SECONDARY)}</text>
  ${watermark({ x: CANVAS.w - SAFE, y: barY + 96, anchor: "end", size: 27 })}`,
  );
}

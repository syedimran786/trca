/**
 * Batch / Course Launch (#151).
 *
 * Navy field with cyan accents, the instructor's portrait, a feature grid and
 * a "Join Now" CTA. The watermark under the CTA is the `.com` this ticket
 * corrects.
 *
 * Features are a list, not four fixed slots, because a Python batch and an FDE
 * batch do not advertise the same number of things — and a template with an
 * empty fourth box is how a graphic ends up shipped with placeholder text in
 * it. Anything past six is dropped by the layout rather than overflowing.
 */
import { COLOR, FONT, PHONE_PRIMARY, CANVAS, SAFE } from "../brand.js";
import { doc, esc, logoMark, photoSlot, textBlock, watermark, wrap } from "./_shared.js";

export const meta = {
  id: "batch-launch",
  title: "Batch / Course Launch",
  fields: "course, kicker, startDate, instructor, instructorRole, features[], cta",
};

export const sample = {
  kicker: "New Batch",
  course: "Java Full Stack Development",
  startDate: "Starts 22 September",
  instructor: "Uday",
  instructorRole: "Lead Instructor",
  features: ["Live classes", "Real projects", "Placement support", "EMI available"],
  cta: "Join Now",
};

export function render(d = sample) {
  const data = { ...sample, ...d };
  const features = (data.features || []).slice(0, 6);

  /* Two columns. Rows are computed rather than fixed so three features leave
     no gap where a fourth would have been. */
  const colW = 400;
  const grid = features
    .map((f, i) => {
      const x = SAFE + (i % 2) * (colW + 24);
      const y = 640 + Math.floor(i / 2) * 68;
      return `
    <g>
      <circle cx="${x + 13}" cy="${y - 9}" r="13" fill="${COLOR.cyan}" fill-opacity="0.18"/>
      <path d="M ${x + 7} ${y - 9} l 4 5 l 8 -10" fill="none" stroke="${COLOR.cyan}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <text x="${x + 40}" y="${y}" font-family="${FONT}" font-size="28" font-weight="500" fill="${COLOR.white}">${esc(f)}</text>
    </g>`;
    })
    .join("");

  const gridBottom = 640 + Math.ceil(features.length / 2) * 68;

  return doc(
    `
    <linearGradient id="navyField" x1="0" y1="0" x2="0.6" y2="1">
      <stop offset="0%" stop-color="${COLOR.navy}"/>
      <stop offset="100%" stop-color="${COLOR.navyDeep}"/>
    </linearGradient>
    <clipPath id="uday"><circle cx="880" cy="300" r="150"/></clipPath>`,
    `
  <rect width="${CANVAS.w}" height="${CANVAS.h}" fill="url(#navyField)"/>

  <!-- Cyan accents: a corner wedge and a rule, the two marks the existing
       graphics use. Kept off the safe margin so a story crop keeps them. -->
  <path d="M ${CANVAS.w} 0 L ${CANVAS.w} 300 L ${CANVAS.w - 300} 0 Z" fill="${COLOR.cyan}" fill-opacity="0.10"/>
  <rect x="0" y="0" width="10" height="${CANVAS.h}" fill="${COLOR.cyan}" fill-opacity="0.55"/>

  ${logoMark({ x: SAFE, y: 68, size: 72 })}

  <text x="${SAFE}" y="266" font-family="${FONT}" font-size="27" font-weight="700" fill="${COLOR.cyan}" letter-spacing="6">${esc(String(data.kicker).toUpperCase())}</text>

  ${textBlock(wrap(data.course, { size: 66, width: 620, maxLines: 3 }), {
    x: SAFE, y: 348, size: 66, weight: 700, fill: COLOR.white, lh: 1.12,
  })}

  <text x="${SAFE}" y="${348 + 66 * 1.12 * Math.min(3, wrap(data.course, { size: 66, width: 620, maxLines: 3 }).length - 1) + 66}" font-family="${FONT}" font-size="34" font-weight="600" fill="${COLOR.orange}">${esc(data.startDate)}</text>

  <!-- Instructor, circle-cropped top right. -->
  ${photoSlot({ x: 730, y: 150, w: 300, h: 300, label: "INSTRUCTOR", clip: ' clip-path="url(#uday)"' })}
  <circle cx="880" cy="300" r="150" fill="none" stroke="${COLOR.cyan}" stroke-opacity="0.65" stroke-width="4"/>
  <text x="880" y="492" font-family="${FONT}" font-size="30" font-weight="700" fill="${COLOR.white}" text-anchor="middle">${esc(data.instructor)}</text>
  <text x="880" y="526" font-family="${FONT}" font-size="24" font-weight="400" fill="${COLOR.white}" fill-opacity="0.7" text-anchor="middle">${esc(data.instructorRole)}</text>

  <rect x="${SAFE}" y="580" width="120" height="3" fill="${COLOR.cyan}" fill-opacity="0.7"/>
  ${grid}

  <!-- CTA. Sits below whatever height the feature grid ended up. -->
  <g transform="translate(${SAFE} ${Math.max(gridBottom + 22, 860)})">
    <rect x="0" y="0" width="300" height="76" rx="38" fill="${COLOR.orange}"/>
    <text x="150" y="49" font-family="${FONT}" font-size="32" font-weight="700" fill="${COLOR.navy}" text-anchor="middle">${esc(data.cta)}</text>
    <text x="330" y="49" font-family="${FONT}" font-size="28" font-weight="600" fill="${COLOR.white}" fill-opacity="0.9">${esc(PHONE_PRIMARY)}</text>
  </g>

  ${watermark({ x: CANVAS.w - SAFE, y: CANVAS.h - 58, anchor: "end", size: 27 })}`,
  );
}

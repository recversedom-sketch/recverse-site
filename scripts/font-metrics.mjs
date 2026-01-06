import fs from "node:fs";
import path from "node:path";
import fontkit from "fontkit";

/**
 * Computes CSS metric overrides from the font's OS/2 table.
 * Produces ascent/descent/lineGap percentages based on unitsPerEm.
 *
 * NOTE: size-adjust depends on chosen fallback metrics. This script outputs
 * the font's own percentages; you will still set size-adjust to match fallback.
 * For best results, pick a stable fallback (e.g. Arial) and compute size-adjust
 * with capsize metrics (recommended approach).
 */

function readFont(fontPath) {
  const buf = fs.readFileSync(fontPath);
  return fontkit.create(buf);
}

function pct(n, denom) {
  return `${Math.round((n / denom) * 10000) / 100}%`;
}

function dumpFont(fontPath) {
  const f = readFont(fontPath);

  const unitsPerEm = f.unitsPerEm;
  const os2 = f["OS/2"] || f["OS2"] || f.tables?.os2;

  // fontkit exposes different shapes depending on font; use safe access
  const ascent = f.ascent ?? os2?.sTypoAscender ?? os2?.usWinAscent;
  const descentRaw = f.descent ?? os2?.sTypoDescender ?? -os2?.usWinDescent;
  const lineGap = os2?.sTypoLineGap ?? 0;

  const descent = Math.abs(descentRaw);

  console.log(`\n== ${path.basename(fontPath)} ==`);
  console.log({ unitsPerEm, ascent, descent, lineGap });

  console.log("Suggested overrides (font-native):");
  console.log(`  ascent-override: ${pct(ascent, unitsPerEm)};`);
  console.log(`  descent-override: ${pct(descent, unitsPerEm)};`);
  console.log(`  line-gap-override: ${pct(lineGap, unitsPerEm)};`);
  console.log("  size-adjust: <compute vs fallback>;  (see notes below)");
}

const inter = path.resolve("public/fonts/inter/Inter-Variable.woff2");
const space = path.resolve("public/fonts/space-grotesk/SpaceGrotesk-Variable.woff2");

dumpFont(inter);
dumpFont(space);

console.log(`
Next step (recommended): compute size-adjust vs your chosen fallback font.
- Choose a fallback (Arial is stable on Windows; system-ui differs by OS).
- Use capsize metrics to compute size-adjust so fallback renders at same cap-height.
- Then apply ascent/descent/line-gap overrides printed above.
`);

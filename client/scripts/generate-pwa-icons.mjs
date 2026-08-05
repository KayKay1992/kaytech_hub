// One-time icon generation for PWA install icons — rasterizes the existing
// favicon "K" mark (public/favicon.svg) at the standard PWA sizes, plus a
// maskable variant with a full-bleed background and the mark shrunk into
// the safe zone (OS icon masks crop anything outside the inner ~80%).
// Run with `node scripts/generate-pwa-icons.mjs`. `sharp` is a throwaway
// devDependency for this script only — safe to remove after running.
import sharp from 'sharp';
import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

// Same design as public/favicon.svg (navy rounded-square + amber "K" arrow),
// just re-emitted at a size-agnostic viewBox so sharp can rasterize cleanly.
const REGULAR_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#10142B"/>
  <g stroke="#FFB020" stroke-width="9" stroke-linecap="square">
    <line x1="22" y1="16" x2="22" y2="48"/>
    <line x1="22" y1="32" x2="46" y2="14"/>
    <line x1="22" y1="32" x2="46" y2="50"/>
  </g>
</svg>
`;

// Maskable: background must be edge-to-edge (no rounded corners — the OS
// applies its own shape), and the mark is scaled to 75% around the center
// so it stays within the ~80% "safe zone" circle after masking.
const MASKABLE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#10142B"/>
  <g stroke="#FFB020" stroke-width="6.75" stroke-linecap="square">
    <line x1="24.5" y1="20" x2="24.5" y2="44"/>
    <line x1="24.5" y1="32" x2="42.5" y2="18.5"/>
    <line x1="24.5" y1="32" x2="42.5" y2="45.5"/>
  </g>
</svg>
`;

const jobs = [
  { svg: REGULAR_SVG, size: 192, out: 'pwa-192x192.png' },
  { svg: REGULAR_SVG, size: 512, out: 'pwa-512x512.png' },
  { svg: MASKABLE_SVG, size: 512, out: 'maskable-icon-512x512.png' },
];

for (const { svg, size, out } of jobs) {
  const outPath = path.join(publicDir, out);
  const buffer = await sharp(Buffer.from(svg), { density: 384 })
    .resize(size, size)
    .png()
    .toBuffer();
  writeFileSync(outPath, buffer);
  console.log(`Wrote ${out} (${size}x${size})`);
}

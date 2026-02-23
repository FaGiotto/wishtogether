import sharp from 'sharp';
import { readFileSync, mkdirSync } from 'fs';

const PRIMARY = '#7C5CFC';
const hex = PRIMARY.slice(1);
const r = parseInt(hex.slice(0, 2), 16);
const g = parseInt(hex.slice(2, 4), 16);
const b = parseInt(hex.slice(4, 6), 16);

mkdirSync('./assets', { recursive: true });

// SVG logo: cerchio viola con cuore bianco
function makeSvg(size) {
  const pad = size * 0.18;
  const inner = size - pad * 2;
  // Cuore SVG path scalato
  const cx = size / 2;
  const cy = size / 2;
  const hs = inner * 0.38; // heart scale
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" rx="${size * 0.22}" fill="${PRIMARY}"/>
  <path transform="translate(${cx - hs},${cy - hs * 0.85}) scale(${hs / 12})"
    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
    fill="white"/>
</svg>`;
}

// Splash: solo sfondo viola pieno (l'immagine è trasparente, il bg la copre)
function makeSplashSvg(size) {
  const cx = size / 2;
  const cy = size / 2;
  const hs = size * 0.15;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
  <rect width="${size}" height="${size}" fill="${PRIMARY}"/>
  <path transform="translate(${cx - hs},${cy - hs * 1.1}) scale(${hs / 12})"
    d="M12 21.593c-5.63-5.539-11-10.297-11-14.402 0-3.791 3.068-5.191 5.281-5.191 1.312 0 4.151.501 5.719 4.457 1.59-3.968 4.464-4.447 5.726-4.447 2.54 0 5.274 1.621 5.274 5.181 0 4.069-5.136 8.625-11 14.402z"
    fill="white" opacity="0.95"/>
</svg>`;
}

async function gen(svgStr, outPath, size) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(outPath);
  console.log(`✓ ${outPath} (${size}×${size})`);
}

// icon.png — 1024×1024
await gen(makeSvg(1024), './assets/icon.png', 1024);

// adaptive-icon.png — 1024×1024 (Android, foreground su sfondo viola)
await gen(makeSvg(1024), './assets/adaptive-icon.png', 1024);

// splash-icon.png — 200×200 logo su trasparente (il bg è in app.json)
await sharp(Buffer.from(makeSvg(512)))
  .resize(200, 200)
  .png()
  .toFile('./assets/splash-icon.png');
console.log('✓ ./assets/splash-icon.png (200×200)');

// favicon.png — 48×48
await gen(makeSvg(256), './assets/favicon.png', 48);

console.log('\nTutti gli asset generati!');

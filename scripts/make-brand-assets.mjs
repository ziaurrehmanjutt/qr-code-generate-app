// Generates the DiyaQR logo, store icon and the source images for @capacitor/assets.
//   node scripts/make-brand-assets.mjs && npx capacitor-assets generate --android
// The mark is a QR code whose last module is a spark of light ("diya" / ضياء = light).
import { mkdirSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const TEAL_DARK = '#0b6b60';
const TEAL_LIGHT = '#1fb39e';
const CORAL = '#e9785c';
const SPARK_LIGHT = '#ffd0bf';

mkdirSync('assets', { recursive: true });
mkdirSync('src/assets/icon', { recursive: true });

const M = 60; // module size of the 9x9 glyph (540 x 540)

/** Path of a rounded square. */
const rr = (x, y, s, r) =>
  `M${x + r} ${y}H${x + s - r}A${r} ${r} 0 0 1 ${x + s} ${y + r}V${y + s - r}A${r} ${r} 0 0 1 ${x + s - r} ${y + s}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + s - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

const finder = (col, row) => {
  const x = col * M;
  const y = row * M;
  return (
    `<path fill="#fff" fill-rule="evenodd" d="${rr(x, y, 3 * M, 46)}${rr(x + 30, y + 30, 2 * M, 26)}"/>` +
    `<rect x="${x + 60}" y="${y + 60}" width="60" height="60" rx="18" fill="#fff"/>`
  );
};

// [column, row] of the data modules. The bottom-right area is kept free for the spark.
const DOTS = [
  [3, 0], [4, 1], [5, 0], [3, 2], [5, 2],
  [0, 3], [2, 3], [3, 3], [5, 3], [6, 3], [8, 3],
  [1, 4], [3, 4], [4, 4], [7, 4],
  [2, 5], [4, 5],
  [3, 6], [4, 7], [3, 8],
];

const glyph = () => {
  const dots = DOTS.map(([c, r]) => `<rect x="${c * M + 5}" y="${r * M + 5}" width="50" height="50" rx="16" fill="#fff"/>`).join('');
  const star = 'M0 -104Q0 0 104 0Q0 0 0 104Q0 0 -104 0Q0 0 0 -104Z';
  return (
    finder(0, 0) + finder(6, 0) + finder(0, 6) + dots +
    `<circle cx="450" cy="450" r="150" fill="url(#glow)"/>` +
    `<path transform="translate(450 450)" d="${star}" fill="url(#spark)"/>` +
    `<circle cx="450" cy="450" r="14" fill="#fff"/>`
  );
};

const defs = `<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${TEAL_DARK}"/><stop offset="1" stop-color="${TEAL_LIGHT}"/></linearGradient>
  <radialGradient id="glow"><stop offset="0" stop-color="${CORAL}" stop-opacity="0.65"/><stop offset="1" stop-color="${CORAL}" stop-opacity="0"/></radialGradient>
  <linearGradient id="spark" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${SPARK_LIGHT}"/><stop offset="1" stop-color="${CORAL}"/></linearGradient>
</defs>`;

/** The glyph centred on a 1024 canvas at the given scale. */
const placed = (scale) => {
  const offset = 512 - (270 * scale);
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">${glyph()}</g>`;
};

const svg = (size, body) => `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 1024 1024">${defs}${body}</svg>`;
const png = async (file, markup, size) => sharp(Buffer.from(markup)).resize(size, size).png().toFile(file);

// Adaptive icon layers (the glyph stays inside the 66% safe zone) and the legacy icon.
await png('assets/icon-background.png', svg(1024, '<rect width="1024" height="1024" fill="url(#bg)"/>'), 1024);
await png('assets/icon-foreground.png', svg(1024, placed(0.86)), 1024);
await png('assets/icon-only.png', svg(1024, `<rect width="1024" height="1024" fill="url(#bg)"/>${placed(1.2)}`), 1024);

// Play Store icon (512, square: Google applies the mask).
await png('assets/store-icon-512.png', svg(1024, `<rect width="1024" height="1024" fill="url(#bg)"/>${placed(1.2)}`), 512);

// Standalone logo with rounded corners, for the app and the web.
const logo = svg(1024, `<rect width="1024" height="1024" rx="230" fill="url(#bg)"/>${placed(1.2)}`);
writeFileSync('assets/logo.svg', logo);
writeFileSync('src/assets/icon/logo.svg', logo);
await png('src/assets/icon/favicon.png', logo, 64);

// Splash screens: the logo tile on the app background (light and dark).
const splash = (bg) => {
  const tile = 0.34; // tile size relative to the 2732 canvas
  const size = 2732;
  const s = (size * tile) / 1024;
  const offset = (size - 1024 * s) / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">${defs}
  <rect width="${size}" height="${size}" fill="${bg}"/>
  <g transform="translate(${offset} ${offset}) scale(${s})"><rect width="1024" height="1024" rx="230" fill="url(#bg)"/>${placed(1.2)}</g></svg>`;
};
await sharp(Buffer.from(splash('#f4f7f6'))).png().toFile('assets/splash.png');
await sharp(Buffer.from(splash('#0c1316'))).png().toFile('assets/splash-dark.png');

console.log('Brand assets written to ./assets and ./src/assets/icon');

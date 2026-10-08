// Generates the little style pictures shown in the Create tab (src/assets/qr/thumb-*.png).
// They are drawn by qr-code-styling itself, so every tile shows exactly what the option produces.
//
//   NODE_PATH=<folder with puppeteer-core>/node_modules node scripts/make-style-thumbs.cjs
//
// Needs `puppeteer-core` (not a project dependency) and an installed Chrome. Run it again only
// when a style is added or the library is upgraded; the generated files are committed.
const fs = require('node:fs');
const path = require('node:path');
const puppeteer = require('puppeteer-core');

const CHROME = process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const OUT = path.join(__dirname, '..', 'src', 'assets', 'qr');
const LIB = path.join(__dirname, '..', 'node_modules', 'qr-code-styling', 'lib', 'qr-code-styling.js');

const DOTS = ['square', 'rounded', 'dots', 'classy', 'classy-rounded', 'extra-rounded'];
const FRAMES = ['square', 'rounded', 'extra-rounded', 'dot', 'dots', 'classy', 'classy-rounded'];
const EYES = ['square', 'dot', 'rounded', 'extra-rounded', 'dots', 'classy', 'classy-rounded'];
const DARK = '#0f1f24';
const TEAL = '#0f7d70';

const variants = [
  ...DOTS.map((t) => ({ file: `thumb-dots-${t}`, dots: { type: t, color: DARK }, frame: { type: 'square', color: DARK }, eye: { type: 'square', color: DARK } })),
  ...FRAMES.map((t) => ({ file: `thumb-frame-${t}`, dots: { type: 'square', color: DARK }, frame: { type: t, color: TEAL }, eye: { type: 'square', color: DARK } })),
  ...EYES.map((t) => ({ file: `thumb-eye-${t}`, dots: { type: 'square', color: DARK }, frame: { type: 'square', color: DARK }, eye: { type: t, color: TEAL } })),
];

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new' });
  const page = await browser.newPage();
  await page.setContent('<body></body>');
  await page.addScriptTag({ content: fs.readFileSync(LIB, 'utf8') });

  for (const v of variants) {
    const base64 = await page.evaluate(async (v) => {
      // 'DiyaQR' is a version 1 code: 21 x 21 modules, 20 px each at 420 px.
      const qr = new window.QRCodeStyling({
        width: 420, height: 420, margin: 0, data: 'DiyaQR',
        qrOptions: { errorCorrectionLevel: 'L' },
        backgroundOptions: { color: '#ffffff' },
        dotsOptions: v.dots, cornersSquareOptions: v.frame, cornersDotOptions: v.eye,
      });
      const blob = await qr.getRawData('png');
      const image = await createImageBitmap(blob);
      // Crop to the top-left corner marker plus a few data modules around it.
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = 220;
      canvas.getContext('2d').drawImage(image, 0, 0, 220, 220, 0, 0, 220, 220);
      return canvas.toDataURL('image/png').split(',')[1];
    }, v);
    fs.writeFileSync(path.join(OUT, `${v.file}.png`), Buffer.from(base64, 'base64'));
  }
  await browser.close();
  console.log(`${variants.length} thumbnails written to src/assets/qr`);
})();

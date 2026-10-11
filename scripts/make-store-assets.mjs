// Builds the Google Play listing images: a feature graphic and six phone screenshots,
// in English and Arabic. The app screens are drawn as HTML (not captured from the app).
//   node scripts/make-store-assets.mjs
// Output: store/<lang>/*.png (screenshots 1080x1920) and store/<lang>/feature-graphic.png (1024x500).
// Needs Chrome or Edge installed, for the headless screenshots.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import qrcode from 'qrcode-generator';

const BROWSERS = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
];
const browser = BROWSERS.find(existsSync);
if (!browser) throw new Error('Chrome or Edge was not found.');

// ---------------------------------------------------------------- strings
const arSource = readFileSync('src/app/i18n/ar.ts', 'utf8');
const AR = {};
for (const line of arSource.split('\n')) {
  const m = line.match(/^ {2}'(.*?)': '(.*)',$/);
  if (m) AR[m[1]] = m[2];
}

const COPY = {
  en: {
    slides: [
      ['CREATE', 'Create any QR code', 'Links, Wi-Fi, contacts and more in seconds'],
      ['STYLE', 'Make it yours', 'Colors, shapes, gradients and your own logo'],
      ['SCAN', 'Scan in a flash', 'From the camera or a picture, with smart actions'],
      ['HOME', 'Everything in one place', 'Your created and scanned codes, saved and searchable'],
      ['EXPORT', 'Save and share anywhere', 'PNG, JPEG, SVG or WebP, to the gallery or any app'],
      ['LANGUAGES', 'Speaks your language', '12 languages, including right-to-left'],
    ],
    banner: ['Create & scan', 'beautiful QR codes', 'Free · No account · Private'],
  },
  ar: {
    slides: [
      ['إنشاء', 'أنشئ أي رمز QR', 'روابط وواي فاي وجهات اتصال وأكثر في ثوانٍ'],
      ['التصميم', 'اجعله بتصميمك', 'ألوان وأشكال وتدرّجات وشعارك الخاص'],
      ['المسح', 'امسح في لحظة', 'من الكاميرا أو من صورة، مع إجراءات ذكية'],
      ['الرئيسية', 'كل شيء في مكان واحد', 'رموزك المُنشأة والممسوحة محفوظة وقابلة للبحث'],
      ['التصدير', 'احفظ وشارك أينما شئت', 'PNG وJPEG وSVG وWebP إلى المعرض أو أي تطبيق'],
      ['اللغات', 'يتحدث لغتك', '12 لغة، بما فيها الكتابة من اليمين إلى اليسار'],
    ],
    banner: ['أنشئ وامسح', 'رموز QR جميلة', 'مجاني · بلا حساب · خاص'],
  },
};

// ---------------------------------------------------------------- helpers
const icon = (name) => readFileSync(`node_modules/ionicons/dist/svg/${name}.svg`, 'utf8').replace('<svg ', '<svg width="100%" height="100%" ');
const logoUri = 'data:image/svg+xml;base64,' + readFileSync('assets/logo.svg').toString('base64');
const ic = (name, cls = '') => `<i class="ic ${cls}">${icon(name)}</i>`;

const rr = (x, y, s, r) =>
  `M${x + r} ${y}H${x + s - r}A${r} ${r} 0 0 1 ${x + s} ${y + r}V${y + s - r}A${r} ${r} 0 0 1 ${x + s - r} ${y + s}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + s - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;

let qrCount = 0;
/** A styled QR code as an inline SVG. */
function qr(data, { size = 240, from = '#0b6b60', to = '#1fb39e', bg = '#fff', style = 'rounded', logo = false, radius = 0 } = {}) {
  const code = qrcode(0, logo ? 'H' : 'M');
  code.addData(data);
  code.make();
  const n = code.getModuleCount();
  const q = 1; // quiet zone in modules
  const total = n + q * 2;
  const id = `g${qrCount++}`;
  const inFinder = (r, c) => (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  const half = Math.floor(n * 0.11);
  const mid = Math.floor(n / 2);
  const inLogo = (r, c) => logo && Math.abs(r - mid) <= half && Math.abs(c - mid) <= half;
  let body = '';
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!code.isDark(r, c) || inFinder(r, c) || inLogo(r, c)) continue;
      const x = c + q;
      const y = r + q;
      body += style === 'dots'
        ? `<circle cx="${x + 0.5}" cy="${y + 0.5}" r="0.46"/>`
        : style === 'square'
          ? `<rect x="${x}" y="${y}" width="1.02" height="1.02"/>`
          : `<rect x="${x + 0.04}" y="${y + 0.04}" width="0.92" height="0.92" rx="0.32"/>`;
    }
  }
  const finders = [[0, 0], [0, n - 7], [n - 7, 0]]
    .map(([r, c]) => {
      const x = c + q;
      const y = r + q;
      return `<path fill-rule="evenodd" d="${rr(x, y, 7, 2.2)}${rr(x + 1, y + 1, 5, 1.4)}"/><path d="${rr(x + 2, y + 2, 3, 1)}"/>`;
    })
    .join('');
  const logoSize = half * 2 + 1;
  const logoSvg = logo
    ? `<rect x="${q + mid - logoSize / 2 - 0.3}" y="${q + mid - logoSize / 2 - 0.3}" width="${logoSize + 0.6}" height="${logoSize + 0.6}" rx="1.6" fill="#fff"/>` +
      `<image href="${logoUri}" x="${q + mid - logoSize / 2}" y="${q + mid - logoSize / 2}" width="${logoSize}" height="${logoSize}"/>`
    : '';
  return `<svg class="qr" width="${size}" height="${size}" viewBox="0 0 ${total} ${total}" xmlns="http://www.w3.org/2000/svg">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${from}"/><stop offset="1" stop-color="${to}"/></linearGradient></defs>` +
    `<rect width="${total}" height="${total}" rx="${radius}" fill="${bg}"/>` +
    `<g fill="url(#${id})">${body}${finders}</g>${logoSvg}</svg>`;
}

// ---------------------------------------------------------------- app screens (390 x 670 logical px)
function screens(lang) {
  const t = (key) => (lang === 'ar' && AR[key]) || key;
  const tabs = (active) => `
    <nav class="tabs">
      ${[['home-outline', 'Home'], ['color-wand-outline', 'Create'], ['scan-outline', 'Scan']]
        .map(([i, k]) => `<div class="${active === k ? 'on' : ''}">${ic(i)}<span>${t(k)}</span></div>`).join('')}
    </nav>`;
  const status = (dark = false) => `<div class="status ${dark ? 'dark' : ''}" dir="ltr"><b>9:41</b><span class="sig"><i></i><i></i><i></i><u></u></span></div>`;
  const header = (title) => `<div class="head"><h2>${t(title)}</h2></div>`;

  const create = `
    ${status()}${header('Create')}
    <div class="chips">
      ${['Text', 'URL', 'Wi-Fi', 'Contact', 'Email', 'Phone']
        .map((k) => `<span class="chip ${k === 'URL' ? 'on' : ''}">${t(k)}</span>`).join('')}
    </div>
    <div class="card field"><label>${t('Content')}</label><div class="input">https://diyaqr.app</div></div>
    <div class="card preview">
      <div class="cap"><span>${t('Live preview')}</span><em>${t('Full preview')}</em></div>
      <div class="qrwrap">${qr('https://diyaqr.app/hello', { size: 214, logo: true, radius: 1 })}</div>
    </div>
    <div class="btnrow"><span class="btn">${t('Save')}</span><span class="btn ghost">${t('Export')}</span></div>
    ${tabs('Create')}`;

  const swatch = (name, a, b) => `<div class="sw"><span style="background:linear-gradient(135deg,${a},${b})"></span><small>${t(name)}</small></div>`;
  const style = `
    ${status()}${header('Create')}
    <div class="qrhero">${qr('https://diyaqr.app/style', { size: 176, from: '#e9785c', to: '#7a2cd6', style: 'dots', logo: true, radius: 1.2 })}</div>
    <div class="seg">${['Style', 'Colors', 'Logo', 'More'].map((k) => `<span class="${k === 'Colors' ? 'on' : ''}">${t(k)}</span>`).join('')}</div>
    <div class="card">
      <p class="lbl">${t('Ready-made')}</p>
      <div class="sws">
        ${swatch('Classic', '#0b6b60', '#1fb39e')}${swatch('Ocean', '#0a4fa3', '#22c1ee')}${swatch('Sunset', '#e9785c', '#ffb347')}
        ${swatch('Neon', '#7a2cd6', '#e91e8c')}${swatch('Forest', '#14532d', '#84cc16')}
      </div>
      <p class="lbl">${t('Dots')} · ${t('Shape')}</p>
      <div class="chips tight">${['Square', 'Circle', 'Rounded', 'Classy'].map((k) => `<span class="chip ${k === 'Circle' ? 'on' : ''}">${t(k)}</span>`).join('')}</div>
      <p class="lbl">${t('Gradient')}</p>
      <div class="bar"><i></i><b></b></div>
    </div>
    ${tabs('Create')}`;

  const scan = `
    <div class="cam">
      ${status(true)}
      <h2 class="camtitle">${t('Scan a QR code')}</h2>
      <div class="poster">${qr('https://diyaqr.app/scan', { size: 196, from: '#0f1f24', to: '#0f1f24', style: 'square' })}</div>
      <div class="frame"><i></i><i></i><i></i><i></i><u></u></div>
      <div class="sheet">
        <div class="grab"></div>
        <div class="res">
          <span class="rico">${ic('globe-outline')}</span>
          <div><strong>${t('Website')}</strong><small>diyaqr.app/scan</small></div>
        </div>
        <span class="btn wide">${ic('open-outline')}${t('Open website')}</span>
        <div class="two"><span class="btn ghost">${ic('copy-outline')}${t('Copy link')}</span><span class="btn ghost">${ic('share-social-outline')}${t('Share')}</span></div>
      </div>
    </div>`;

  const row = (a, b, kind, qrData, fav, colors) => `
    <div class="item"><span class="thumb">${qr(qrData, { size: 46, ...colors, radius: 0.6 })}</span>
      <div><strong>${a}</strong><small>${b}</small></div>
      <span class="star ${fav ? 'on' : ''}">${ic(fav ? 'star' : 'star-outline')}</span></div>`;
  const home = `
    ${status()}
    <div class="head"><h2>DiyaQR</h2><span class="avatar"><img src="${logoUri}" alt=""></span></div>
    <div class="search">${ic('search-outline')}<span>${t('Search')}</span></div>
    <div class="stats">
      <div><b>24</b><small>${t('Created')}</small></div>
      <div><b>58</b><small>${t('Scanned')}</small></div>
      <div><b>12</b><small>${t('Saved')}</small></div>
    </div>
    <div class="seg"><span class="on">${t('Created')}</span><span>${t('Scanned')}</span><span>${t('Favorites')}</span></div>
    <div class="list">
      ${row('Cafe Wi-Fi', t('Wi-Fi network'), '', 'WIFI:T:WPA;S:Cafe;P:12345678;;', true, {})}
      ${row('diyaqr.app', t('Web link'), '', 'https://diyaqr.app', false, { from: '#e9785c', to: '#7a2cd6' })}
      ${row('Ahmed Ali', t('Contact card'), '', 'BEGIN:VCARD\nFN:Ahmed Ali\nEND:VCARD', true, { from: '#0a4fa3', to: '#22c1ee' })}
      ${row('Riyadh Expo', t('Calendar event'), '', 'BEGIN:VEVENT\nSUMMARY:Riyadh Expo\nEND:VEVENT', false, { from: '#14532d', to: '#84cc16' })}
    </div>
    ${tabs('Home')}`;

  const opt = (i, a, b, on) => `<div class="opt ${on ? 'on' : ''}"><span class="oi">${ic(i)}</span><div><strong>${a}</strong><small>${b}</small></div></div>`;
  const exportScreen = `
    ${status()}${header('Create')}
    <div class="qrhero small">${qr('https://diyaqr.app/export', { size: 130, from: '#0b6b60', to: '#1fb39e', logo: true, radius: 1 })}</div>
    <div class="card">
      <p class="lbl">${t('Format')}</p>
      <div class="seg flat">${['PNG', 'JPEG', 'SVG', 'WebP'].map((k) => `<span class="${k === 'PNG' ? 'on' : ''}">${k}</span>`).join('')}</div>
      <p class="lbl">${t('File name')}</p>
      <div class="input">diyaqr-code</div>
    </div>
    <div class="card list2">
      <p class="lbl">${t('What to do')}</p>
      ${opt('share-social-outline', t('Share'), t('WhatsApp, mail, Drive…'), true)}
      ${opt('images-outline', t('Save to gallery'), t('Album “DiyaQR”'))}
      ${opt('bookmark-outline', t('Save in app'), t('Keep it editable in Home'))}
      ${opt('open-outline', t('Open with…'), t('Another app'))}
    </div>
    ${tabs('Create')}`;

  const langs = [['English', 'en'], ['العربية', 'ar'], ['Español', 'es'], ['Français', 'fr'], ['हिन्दी', 'hi'], ['اردو', 'ur'], ['Indonesia', 'id'], ['Português', 'pt'], ['Türkçe', 'tr'], ['বাংলা', 'bn'], ['Filipino', 'fil'], ['فارسی', 'fa']];
  const current = lang;
  const languages = `
    ${status()}
    <div class="head"><span class="back">${ic('chevron-down', 'rot')}</span><h2 class="mid">${t('Settings')}</h2></div>
    <p class="grp">${t('Appearance')}</p>
    <div class="card"><p class="lbl">${t('Theme')}</p><div class="seg flat"><span>${t('System')}</span><span class="on">${t('Light')}</span><span>${t('Dark')}</span></div></div>
    <p class="grp">${t('Language')}</p>
    <div class="card langs">
      ${langs.map(([n, c]) => `<div class="lrow ${c === current ? 'on' : ''}"><span>${n}</span>${c === current ? ic('checkmark-circle') : ''}</div>`).join('')}
    </div>`;

  return { create, style, scan, home, export: exportScreen, languages };
}

// ---------------------------------------------------------------- page styles
const CSS = `
*{box-sizing:border-box;margin:0;padding:0}
:root{--bg:#f4f7f6;--surface:#fff;--surface-2:#eef3f1;--line:#e1e8e5;--ink:#0f1f24;--muted:#64767a;--brand:#0f7d70;--brand-soft:#dcf2ec;--accent:#e9785c}
html,body{width:100%;height:100%;overflow:hidden;font-family:'Segoe UI',system-ui,Roboto,'Noto Sans Arabic',Tahoma,sans-serif}
body{position:relative;background:linear-gradient(160deg,#084a43 0%,#0b6b60 45%,#17a08c 100%);color:#fff}
.glow{position:absolute;border-radius:50%;filter:blur(2px)}
.g1{width:900px;height:900px;right:-300px;top:-380px;background:radial-gradient(circle,rgba(233,120,92,.55),rgba(233,120,92,0) 68%)}
.g2{width:1000px;height:1000px;left:-420px;bottom:200px;background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,0) 66%)}
.ring{position:absolute;border:2px solid rgba(255,255,255,.12);border-radius:50%}
.copy{position:absolute;left:70px;right:70px;top:96px}
.pill{display:inline-block;padding:10px 26px;border-radius:999px;background:var(--accent);color:#fff;font-size:30px;font-weight:800;letter-spacing:3px}
.copy h1{margin-top:30px;font-size:92px;line-height:1.06;font-weight:800;letter-spacing:-2px}
.copy p{margin-top:24px;max-width:900px;font-size:42px;line-height:1.3;font-weight:500;color:rgba(255,255,255,.88)}
.phone{position:absolute;left:130px;top:560px;width:820px;height:1500px;padding:20px;border-radius:92px 92px 0 0;background:#0a1417;box-shadow:0 0 0 3px #1f3238 inset,0 60px 120px rgba(0,0,0,.45)}
.phone .vp{width:780px;height:1340px;overflow:hidden;border-radius:74px 74px 0 0;background:var(--bg)}
.phone .cam-notch{position:absolute;left:50%;top:38px;width:26px;height:26px;margin-left:-13px;border-radius:50%;background:#050a0b;z-index:5}
.screen{position:relative;width:390px;height:670px;transform:scale(2);transform-origin:0 0;background:var(--bg);color:var(--ink);overflow:hidden}
.screen *{font-family:inherit}
.status{display:flex;justify-content:space-between;align-items:center;padding:14px 26px 4px;font-size:13px}
.status.dark{position:absolute;left:0;right:0;top:0;color:#fff;z-index:3}
.sig{display:flex;gap:3px;align-items:flex-end}.sig i{width:3px;background:currentColor;border-radius:1px}.sig i:nth-child(1){height:5px}.sig i:nth-child(2){height:8px}.sig i:nth-child(3){height:11px}
.sig u{width:20px;height:10px;margin-left:5px;border:1.5px solid currentColor;border-radius:3px;background:linear-gradient(90deg,currentColor 70%,transparent 70%)}
.head{display:flex;align-items:center;justify-content:space-between;padding:8px 20px 6px}
.head h2{font-size:26px;font-weight:800;letter-spacing:-.4px}
.head .mid{flex:1;text-align:center;font-size:18px}
.back{width:26px;height:26px;color:var(--ink)}.rot{transform:rotate(90deg)}
:dir(rtl) .rot{transform:rotate(-90deg)}
.avatar{width:36px;height:36px;border-radius:11px;overflow:hidden;box-shadow:0 4px 12px rgba(15,31,36,.18)}.avatar img{width:100%;height:100%}
.ic{display:inline-block;width:20px;height:20px;flex:none}.ic svg{fill:currentColor}
.vp{direction:ltr}.copy h1,.copy p{text-wrap:balance}
.chips{display:flex;gap:8px;padding:6px 20px;overflow:hidden;white-space:nowrap}.chips.tight{padding:6px 0 0;flex-wrap:wrap}
.chip{padding:9px 16px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:14px;font-weight:600;color:var(--muted)}
.chip.on{background:var(--brand);border-color:var(--brand);color:#fff}
.card{margin:10px 16px;padding:14px;border-radius:18px;background:var(--surface);box-shadow:0 6px 24px rgba(15,31,36,.07)}
.field label,.lbl{display:block;margin:2px 0 8px;font-size:12px;font-weight:700;letter-spacing:.3px;color:var(--muted)}
.lbl{margin-top:12px}.card>.lbl:first-child{margin-top:0}
.input{padding:12px 14px;border-radius:12px;background:var(--surface-2);border:1.5px solid var(--brand);font-size:15px;font-weight:600;direction:ltr;text-align:start}
.cap{display:flex;justify-content:space-between;font-size:13px;font-weight:700;margin-bottom:10px}.cap em{font-style:normal;color:var(--brand)}
.qrwrap{display:grid;place-items:center;padding:6px 0 2px}
.qr{display:block;border-radius:14px;box-shadow:0 8px 24px rgba(15,31,36,.12)}
.btnrow{display:flex;gap:10px;padding:6px 16px}
.btn{display:flex;align-items:center;justify-content:center;gap:8px;flex:1;padding:14px;border-radius:14px;background:linear-gradient(135deg,var(--brand),#17a08c);color:#fff;font-size:15px;font-weight:800;box-shadow:0 8px 20px rgba(15,125,112,.3)}
.btn.ghost{background:var(--surface);color:var(--brand);border:1.5px solid var(--brand);box-shadow:none}
.btn.wide{flex:none;width:100%}
.btn .ic{width:18px;height:18px}
.tabs{position:absolute;left:0;right:0;bottom:0;display:flex;justify-content:space-around;padding:8px 0 16px;background:var(--surface);border-top:1px solid var(--line)}
.tabs div{display:grid;justify-items:center;gap:2px;font-size:11px;font-weight:700;color:var(--muted)}.tabs div.on{color:var(--brand)}.tabs .ic{width:24px;height:24px}
.qrhero{display:grid;place-items:center;padding:10px 0 6px}.qrhero.small{padding:6px 0 0}
.seg{display:flex;gap:4px;margin:8px 16px;padding:4px;border-radius:14px;background:var(--surface-2)}
.seg span{flex:1;padding:9px 0;text-align:center;border-radius:11px;font-size:13px;font-weight:700;color:var(--muted)}
.seg span.on{background:var(--surface);color:var(--brand);box-shadow:0 2px 8px rgba(15,31,36,.1)}
.seg.flat{margin:0}
.sws{display:flex;justify-content:space-between}.sw{display:grid;justify-items:center;gap:5px}.sw span{width:46px;height:46px;border-radius:50%;box-shadow:0 4px 10px rgba(15,31,36,.18)}.sw small{font-size:11px;font-weight:600;color:var(--muted)}
.bar{position:relative;height:30px;border-radius:15px;background:linear-gradient(90deg,#e9785c,#7a2cd6)}.bar b{position:absolute;top:3px;inset-inline-end:4px;width:24px;height:24px;border-radius:50%;background:#fff;box-shadow:0 2px 6px rgba(0,0,0,.3)}
.cam{position:absolute;inset:0;background:radial-gradient(circle at 50% 30%,#3d5a5e 0%,#14272b 55%,#0a1417 100%)}
.camtitle{position:absolute;left:0;right:0;top:48px;text-align:center;color:#fff;font-size:20px;font-weight:800}
.poster{position:absolute;left:50%;top:130px;margin-left:-118px;padding:20px;border-radius:18px;background:#fff;transform:rotate(-3deg);box-shadow:0 20px 50px rgba(0,0,0,.5)}.poster .qr{box-shadow:none;border-radius:0}
.frame{position:absolute;left:50%;top:92px;width:290px;height:290px;margin-left:-145px}
.frame i{position:absolute;width:46px;height:46px;border:5px solid #fff;border-radius:14px}
.frame i:nth-child(1){left:0;top:0;border-right:0;border-bottom:0}.frame i:nth-child(2){right:0;top:0;border-left:0;border-bottom:0}
.frame i:nth-child(3){left:0;bottom:0;border-right:0;border-top:0}.frame i:nth-child(4){right:0;bottom:0;border-left:0;border-top:0}
.frame u{position:absolute;left:10px;right:10px;top:50%;height:4px;border-radius:2px;background:var(--accent);box-shadow:0 0 18px 4px rgba(233,120,92,.8)}
.sheet{position:absolute;left:0;right:0;bottom:0;padding:10px 18px 22px;border-radius:26px 26px 0 0;background:var(--surface);color:var(--ink);box-shadow:0 -10px 40px rgba(0,0,0,.4)}
.grab{width:40px;height:5px;margin:0 auto 14px;border-radius:3px;background:var(--line)}
.res{display:flex;align-items:center;gap:12px;margin-bottom:14px}.res strong{display:block;font-size:17px}.res small{color:var(--muted);font-size:13px;direction:ltr;display:block;text-align:start}
.rico{display:grid;place-items:center;width:46px;height:46px;border-radius:14px;background:var(--brand-soft);color:var(--brand)}.rico .ic{width:26px;height:26px}
.two{display:flex;gap:10px;margin-top:10px}
.search{display:flex;align-items:center;gap:10px;margin:6px 16px;padding:12px 14px;border-radius:14px;background:var(--surface);border:1px solid var(--line);color:var(--muted);font-size:14px}
.stats{display:flex;gap:10px;margin:10px 16px}.stats div{flex:1;padding:14px 8px;border-radius:16px;background:var(--surface);box-shadow:0 6px 24px rgba(15,31,36,.07);text-align:center}
.stats div:nth-child(1){background:linear-gradient(135deg,var(--brand),#17a08c);color:#fff}
.stats b{display:block;font-size:26px;font-weight:800}.stats small{font-size:12px;font-weight:600;opacity:.8}
.list{padding:4px 16px}
.item{display:flex;align-items:center;gap:12px;margin-bottom:8px;padding:10px;border-radius:16px;background:var(--surface);box-shadow:0 6px 24px rgba(15,31,36,.06)}
.item>div{flex:1}.item strong{display:block;font-size:15px}.item small{font-size:12px;color:var(--muted)}
.thumb .qr{box-shadow:none;border:1px solid var(--line);border-radius:10px}
.star{width:22px;height:22px;color:var(--muted)}.star.on{color:#f2b01e}.star .ic{width:22px;height:22px}
.list2 .opt{display:flex;align-items:center;gap:12px;padding:10px;margin-bottom:6px;border-radius:14px;border:1.5px solid var(--line)}
.opt.on{border-color:var(--brand);background:var(--brand-soft)}.opt strong{display:block;font-size:14px}.opt small{font-size:12px;color:var(--muted)}
.oi{display:grid;place-items:center;width:36px;height:36px;border-radius:11px;background:var(--surface-2);color:var(--brand)}.opt.on .oi{background:var(--brand);color:#fff}
.grp{margin:10px 22px 0;font-size:12px;font-weight:800;letter-spacing:.6px;color:var(--muted);text-transform:uppercase}
.langs{padding:6px 8px}.lrow{display:flex;align-items:center;justify-content:space-between;height:34px;padding:0 12px;border-radius:12px;font-size:16px;font-weight:600;line-height:34px;overflow:hidden;direction:ltr;text-align:left}
.lrow.on{background:var(--brand-soft);color:var(--brand);font-weight:800}.lrow .ic{width:22px;height:22px;color:var(--brand)}
`;

const page = (body, w, h, dir) => `<!doctype html><html dir="${dir}"><head><meta charset="utf-8"><style>${CSS}</style></head><body style="width:${w}px;height:${h}px">${body}</body></html>`;

function slide(lang, i, screenHtml) {
  const [pill, title, sub] = COPY[lang].slides[i];
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  return page(`
    <div class="glow g1"></div><div class="glow g2"></div>
    <div class="ring" style="width:1100px;height:1100px;left:-200px;top:380px"></div>
    <div class="ring" style="width:1500px;height:1500px;left:-400px;top:180px"></div>
    <div class="copy"><span class="pill">${pill}</span><h1>${title}</h1><p>${sub}</p></div>
    <div class="phone"><div class="cam-notch"></div><div class="vp"><div class="screen" dir="${dir}">${screenHtml}</div></div></div>`, 1080, 1920, dir);
}

function banner(lang, screenHtml) {
  const [a, b, c] = COPY[lang].banner;
  const dir = lang === 'ar' ? 'rtl' : 'ltr';
  const side = lang === 'ar' ? 'left' : 'right';
  const textSide = lang === 'ar' ? 'right' : 'left';
  return page(`
    <style>
      .b-copy{position:absolute;${textSide}:56px;top:96px;width:540px}
      .b-copy .row{display:flex;align-items:center;gap:14px;margin-bottom:18px}.b-copy img{width:58px;height:58px;border-radius:16px;box-shadow:0 8px 20px rgba(0,0,0,.3)}.b-copy .name{font-size:34px;font-weight:800}
      .b-copy h1{font-size:54px;line-height:1.08;font-weight:800;letter-spacing:-1px}.b-copy h1 em{font-style:normal;color:#ffd0bf}
      .b-copy p{margin-top:16px;font-size:24px;font-weight:600;color:rgba(255,255,255,.85)}
      .b-phone{position:absolute;${side}:60px;top:52px;width:330px;height:560px;padding:10px;border-radius:44px 44px 0 0;background:#0a1417;box-shadow:0 0 0 2px #1f3238 inset,0 30px 60px rgba(0,0,0,.4);transform:rotate(${lang === 'ar' ? '-' : ''}6deg)}
      .b-phone .vp{width:310px;height:550px;overflow:hidden;border-radius:34px 34px 0 0;background:var(--bg)}
      .b-phone .screen{transform:scale(.795)}
      .b-qr{position:absolute;${side}:330px;top:300px;padding:12px;border-radius:20px;background:#fff;box-shadow:0 20px 40px rgba(0,0,0,.35);transform:rotate(${lang === 'ar' ? '' : '-'}8deg)}
    </style>
    <div class="glow g1" style="width:600px;height:600px;right:-120px;top:-260px"></div>
    <div class="glow g2" style="width:600px;height:600px;left:-260px;bottom:-300px"></div>
    <div class="b-copy"><div class="row"><img src="${logoUri}" alt=""><span class="name">DiyaQR</span></div>
      <h1>${a}<br><em>${b}</em></h1><p>${c}</p></div>
    <div class="b-phone"><div class="vp"><div class="screen" dir="${dir}">${screenHtml}</div></div></div>
    <div class="b-qr">${qr('https://diyaqr.app', { size: 130, from: '#e9785c', to: '#7a2cd6', style: 'dots', logo: true, radius: 0 })}</div>`, 1024, 500, dir);
}

// ---------------------------------------------------------------- render
const NAMES = ['create', 'style', 'scan', 'home', 'export', 'languages'];
mkdirSync('store/src', { recursive: true });

function shot(htmlFile, png, w, h) {
  execFileSync(browser, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
    `--window-size=${w},${h}`, `--screenshot=${resolve(png)}`, '--virtual-time-budget=2000',
    pathToFileURL(resolve(htmlFile)).href,
  ], { stdio: 'ignore' });
}

for (const lang of ['en', 'ar']) {
  mkdirSync(`store/${lang}`, { recursive: true });
  const s = screens(lang);
  NAMES.forEach((name, i) => {
    const file = `store/src/${lang}-${i + 1}-${name}.html`;
    writeFileSync(file, slide(lang, i, s[name]));
    shot(file, `store/${lang}/${i + 1}-${name}.png`, 1080, 1920);
    console.log(`store/${lang}/${i + 1}-${name}.png`);
  });
  const file = `store/src/${lang}-feature-graphic.html`;
  writeFileSync(file, banner(lang, s.create));
  shot(file, `store/${lang}/feature-graphic.png`, 1024, 500);
  console.log(`store/${lang}/feature-graphic.png`);
}

// Builds the static DiyaQR website (one page per language) into site/.
//   node scripts/make-website.mjs
// Upload the CONTENTS of site/ to GitHub Pages (for example into a "diyaqr" folder of your profile site).
// Set the public address first (no trailing slash needed):
//   SITE_URL=https://ziaurrehmanjutt.github.io/diyaqr node scripts/make-website.mjs
// Text comes from store/play-store-listing.txt, images from store/en and store/ar.
import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import sharp from 'sharp';

const SITE_URL = (process.env.SITE_URL || 'https://ziaurrehmanjutt.github.io/diyaqr').replace(/\/+$/, '') + '/';
const PLAY_ID = 'io.zia.diyaqr';
const OUT = 'site';

// code, native name, text direction, hreflang, Play "hl" value, Open Graph locale
const LANGS = [
  { code: 'en', name: 'English', dir: 'ltr', hreflang: 'en', hl: 'en', og: 'en_US' },
  { code: 'ar', name: 'العربية', dir: 'rtl', hreflang: 'ar', hl: 'ar', og: 'ar_AR' },
  { code: 'es', name: 'Español', dir: 'ltr', hreflang: 'es', hl: 'es-419', og: 'es_LA' },
  { code: 'fr', name: 'Français', dir: 'ltr', hreflang: 'fr', hl: 'fr', og: 'fr_FR' },
  { code: 'hi', name: 'हिन्दी', dir: 'ltr', hreflang: 'hi', hl: 'hi', og: 'hi_IN' },
  { code: 'ur', name: 'اردو', dir: 'rtl', hreflang: 'ur', hl: 'ur', og: 'ur_PK' },
  { code: 'id', name: 'Indonesia', dir: 'ltr', hreflang: 'id', hl: 'id', og: 'id_ID' },
  { code: 'pt', name: 'Português', dir: 'ltr', hreflang: 'pt', hl: 'pt-BR', og: 'pt_BR' },
  { code: 'tr', name: 'Türkçe', dir: 'ltr', hreflang: 'tr', hl: 'tr', og: 'tr_TR' },
  { code: 'bn', name: 'বাংলা', dir: 'ltr', hreflang: 'bn', hl: 'bn', og: 'bn_BD' },
  { code: 'fil', name: 'Filipino', dir: 'ltr', hreflang: 'fil', hl: 'fil', og: 'fil_PH' },
  { code: 'fa', name: 'فارسی', dir: 'rtl', hreflang: 'fa', hl: 'fa', og: 'fa_IR' },
];

// Words around the listing text, per language.
const UI = {
  en: ['Create & scan beautiful QR codes', 'Get it on Google Play', 'Features', 'Screenshots', 'Language', 'Privacy policy', 'Free · No account · Your data stays on your phone'],
  ar: ['أنشئ وامسح رموز QR جميلة', 'احصل عليه من Google Play', 'المزايا', 'لقطات الشاشة', 'اللغة', 'سياسة الخصوصية', 'مجاني · بلا حساب · بياناتك تبقى على هاتفك'],
  es: ['Crea y escanea códigos QR preciosos', 'Disponible en Google Play', 'Funciones', 'Capturas de pantalla', 'Idioma', 'Política de privacidad', 'Gratis · Sin cuenta · Tus datos se quedan en tu teléfono'],
  fr: ['Créez et scannez de beaux codes QR', 'Disponible sur Google Play', 'Fonctionnalités', 'Captures d’écran', 'Langue', 'Politique de confidentialité', 'Gratuit · Sans compte · Vos données restent sur votre téléphone'],
  hi: ['सुंदर QR कोड बनाएँ और स्कैन करें', 'Google Play पर पाएँ', 'सुविधाएँ', 'स्क्रीनशॉट', 'भाषा', 'गोपनीयता नीति', 'मुफ़्त · खाता नहीं · आपका डेटा आपके फ़ोन में'],
  ur: ['خوبصورت QR کوڈ بنائیں اور اسکین کریں', 'Google Play سے حاصل کریں', 'خصوصیات', 'اسکرین شاٹس', 'زبان', 'پرائیویسی پالیسی', 'مفت · اکاؤنٹ نہیں · آپ کا ڈیٹا آپ کے فون میں'],
  id: ['Buat & pindai kode QR yang indah', 'Dapatkan di Google Play', 'Fitur', 'Tangkapan layar', 'Bahasa', 'Kebijakan privasi', 'Gratis · Tanpa akun · Data tetap di ponsel Anda'],
  pt: ['Crie e escaneie QR codes lindos', 'Disponível no Google Play', 'Recursos', 'Capturas de tela', 'Idioma', 'Política de privacidade', 'Grátis · Sem conta · Seus dados ficam no celular'],
  tr: ['Güzel QR kodlar oluşturun ve tarayın', 'Google Play’den indirin', 'Özellikler', 'Ekran görüntüleri', 'Dil', 'Gizlilik politikası', 'Ücretsiz · Hesap yok · Verileriniz telefonunuzda kalır'],
  bn: ['সুন্দর QR কোড বানান ও স্ক্যান করুন', 'Google Play থেকে নিন', 'বৈশিষ্ট্য', 'স্ক্রিনশট', 'ভাষা', 'গোপনীয়তা নীতি', 'বিনামূল্যে · অ্যাকাউন্ট ছাড়া · আপনার তথ্য ফোনেই থাকে'],
  fil: ['Gumawa at mag-scan ng magagandang QR code', 'Kunin sa Google Play', 'Mga tampok', 'Mga screenshot', 'Wika', 'Patakaran sa privacy', 'Libre · Walang account · Nasa telepono mo ang datos mo'],
  fa: ['کدهای QR زیبا بسازید و اسکن کنید', 'دریافت از Google Play', 'ویژگی‌ها', 'تصاویر برنامه', 'زبان', 'سیاست حریم خصوصی', 'رایگان · بدون حساب · داده‌ها روی گوشی شما می‌ماند'],
};

// ---------------------------------------------------------------- read the Play listing text
const listing = readFileSync('store/play-store-listing.txt', 'utf8').replace(/\r/g, '');
const parts = listing.split(/^ (\d+\. .*)$/m);
const content = {};
LANGS.forEach((lang, i) => {
  const body = parts[i * 2 + 2];
  const name = body.split('APP NAME\n')[1].split('\n')[0].trim();
  const short = body.split('SHORT DESCRIPTION\n')[1].split('\n')[0].trim();
  const full = body.split('FULL DESCRIPTION\n')[1].split(/\n#{20,}/)[0].trim();
  const blocks = full.split(/\n\n+/);
  const intro = blocks.shift();
  const closing = blocks.pop(); // "Download DiyaQR and ..."
  const sections = blocks.map((b) => {
    const lines = b.split('\n');
    const heading = lines.shift();
    const emoji = heading.match(/^\S+/)[0];
    const title = heading.slice(emoji.length).trim();
    const bullets = lines.filter((l) => l.startsWith('• ')).map((l) => l.slice(2));
    const text = lines.filter((l) => !l.startsWith('• ')).join(' ');
    return { emoji, title, bullets, text };
  });
  content[lang.code] = { name, short, intro, closing, sections };
});

/** "CREATE ANY QR CODE" -> "Create any QR code". Scripts without letter case are left alone. */
function niceHeading(text, lang) {
  if (text === text.toLocaleLowerCase(lang)) return text;
  const lower = text.toLocaleLowerCase(lang).replace(/\bqr\b/g, 'QR').replace(/\bwi-fi\b/g, 'Wi-Fi');
  return lower.charAt(0).toLocaleUpperCase(lang) + lower.slice(1);
}

/** The first sentence or two of the intro, up to about 160 characters, for the meta description. */
function metaDescription(intro) {
  const sentences = intro.match(/[^.。۔!?]+[.。۔!?]?/g) || [intro];
  let text = sentences[0].trim();
  if (text.length < 90 && sentences[1]) text += ' ' + sentences[1].trim();
  return text.length > 160 ? text.slice(0, 157).replace(/\s+\S*$/, '') + '…' : text;
}

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const urlFor = (code) => SITE_URL + (code === 'en' ? '' : `${code}/`);
const playUrl = (hl) => `https://play.google.com/store/apps/details?id=${PLAY_ID}&hl=${hl}`;

// ---------------------------------------------------------------- images
rmSync(OUT, { recursive: true, force: true });
mkdirSync(`${OUT}/assets/shots`, { recursive: true });
const SHOT_NAMES = ['create', 'style', 'scan', 'home', 'export', 'languages'];
for (const set of ['en', 'ar']) {
  for (let i = 0; i < SHOT_NAMES.length; i++) {
    await sharp(`store/${set}/${i + 1}-${SHOT_NAMES[i]}.png`)
      .resize(540, 960)
      .webp({ quality: 84 })
      .toFile(`${OUT}/assets/shots/${set}-${i + 1}.webp`);
  }
}
await sharp('store/en/feature-graphic.png').png({ compressionLevel: 9 }).toFile(`${OUT}/assets/og-image.png`);
await sharp('assets/store-icon-512.png').resize(192, 192).png().toFile(`${OUT}/assets/icon-192.png`);
await sharp('assets/store-icon-512.png').resize(96, 96).png().toFile(`${OUT}/assets/favicon.png`);
copyFileSync('assets/store-icon-512.png', `${OUT}/assets/icon-512.png`);
copyFileSync('policy/policy.html', `${OUT}/policy.html`);
writeFileSync(`${OUT}/.nojekyll`, '');

// ---------------------------------------------------------------- styles
const CSS = `
:root{--bg:#f4f7f6;--surface:#fff;--line:#e1e8e5;--ink:#0f1f24;--muted:#58696d;--brand:#0f7d70;--brand-dark:#0b6b60;--brand-soft:#dcf2ec;--accent:#e9785c;--radius:22px;--shadow:0 10px 40px rgba(15,31,36,.10)}
*{box-sizing:border-box;margin:0;padding:0}
html{scroll-behavior:smooth}
body{font-family:system-ui,-apple-system,'Segoe UI',Roboto,'Noto Sans','Noto Sans Arabic','Noto Sans Devanagari','Noto Sans Bengali',Tahoma,sans-serif;background:var(--bg);color:var(--ink);line-height:1.65;-webkit-font-smoothing:antialiased}
img{max-width:100%;display:block}
a{color:inherit}
.wrap{width:min(1120px,100% - 40px);margin-inline:auto}
header.top{position:absolute;inset:0 0 auto 0;z-index:10;padding:18px 0}
header.top .wrap{display:flex;align-items:center;justify-content:space-between;gap:16px}
.brand{display:flex;align-items:center;gap:12px;color:#fff;font-weight:800;font-size:22px;text-decoration:none}
.brand img{width:44px;height:44px;border-radius:12px;box-shadow:0 6px 18px rgba(0,0,0,.25)}
nav.links{display:flex;align-items:center;gap:22px;color:#fff;font-weight:600}
nav.links a{text-decoration:none;opacity:.9}nav.links a:hover{opacity:1}
details.lang{position:relative}
details.lang summary{list-style:none;cursor:pointer;padding:9px 16px;border-radius:999px;background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);color:#fff;font-weight:700;white-space:nowrap}
details.lang summary::-webkit-details-marker{display:none}
details.lang ul{position:absolute;inset-inline-end:0;top:calc(100% + 8px);min-width:200px;padding:8px;list-style:none;border-radius:16px;background:var(--surface);color:var(--ink);box-shadow:var(--shadow);max-height:70vh;overflow:auto}
details.lang li a{display:block;padding:10px 14px;border-radius:10px;text-decoration:none;font-weight:600}
details.lang li a:hover{background:var(--brand-soft)}
details.lang li a[aria-current]{background:var(--brand-soft);color:var(--brand-dark);font-weight:800}
.hero{position:relative;overflow:hidden;color:#fff;padding:130px 0 90px;background:linear-gradient(160deg,#084a43 0%,#0b6b60 48%,#17a08c 100%)}
.hero::before{content:"";position:absolute;width:760px;height:760px;inset-inline-end:-260px;top:-300px;background:radial-gradient(circle,rgba(233,120,92,.5),rgba(233,120,92,0) 68%)}
.hero::after{content:"";position:absolute;width:900px;height:900px;inset-inline-start:-420px;bottom:-460px;border-radius:50%;background:radial-gradient(circle,rgba(255,255,255,.14),rgba(255,255,255,0) 66%)}
.hero .wrap{position:relative;z-index:1;display:grid;grid-template-columns:1.05fr .95fr;gap:40px;align-items:center}
.eyebrow{display:inline-block;padding:7px 18px;border-radius:999px;background:var(--accent);font-weight:800;font-size:14px;letter-spacing:.4px}
.hero h1{margin-top:20px;font-size:clamp(34px,5.2vw,58px);line-height:1.12;font-weight:800;letter-spacing:-1px}
.hero .sub{margin-top:18px;font-size:clamp(17px,2vw,21px);color:rgba(255,255,255,.9);max-width:34em}
.cta{display:inline-flex;align-items:center;gap:14px;margin-top:30px;padding:14px 26px;border-radius:16px;background:#fff;color:#0f1f24;text-decoration:none;font-weight:800;font-size:18px;box-shadow:0 14px 34px rgba(0,0,0,.28);transition:transform .15s}
.cta:hover{transform:translateY(-2px)}
.cta svg{width:30px;height:30px;flex:none}
.free{margin-top:16px;font-size:15px;color:rgba(255,255,255,.8)}
.phones{position:relative;height:520px}
.phones img{position:absolute;width:250px;border-radius:30px;box-shadow:0 26px 60px rgba(0,0,0,.45);border:4px solid #0a1417;background:#0a1417}
.phones img:nth-child(1){inset-inline-start:0;top:60px;transform:rotate(-6deg)}
.phones img:nth-child(2){inset-inline-start:calc(50% - 135px);top:0;width:270px;z-index:2}
.phones img:nth-child(3){inset-inline-end:0;top:70px;transform:rotate(6deg)}
[dir=rtl] .phones img:nth-child(1){transform:rotate(6deg)}[dir=rtl] .phones img:nth-child(3){transform:rotate(-6deg)}
section.block{padding:84px 0}
section.block h2{font-size:clamp(28px,3.6vw,40px);line-height:1.2;font-weight:800;letter-spacing:-.5px;text-align:center}
.lead{max-width:46em;margin:18px auto 0;text-align:center;color:var(--muted);font-size:19px}
.cards{display:flex;flex-wrap:wrap;justify-content:center;gap:22px;margin-top:46px}
.card{flex:1 1 320px;max-width:360px;padding:28px;border-radius:var(--radius);background:var(--surface);box-shadow:var(--shadow);border:1px solid var(--line)}
.card .ico{display:grid;place-items:center;width:54px;height:54px;border-radius:16px;background:var(--brand-soft);font-size:28px}
.card h3{margin:16px 0 10px;font-size:21px;line-height:1.3}
.card ul{padding-inline-start:20px;color:var(--muted)}
.card li{margin:7px 0}
.card p{color:var(--muted)}
.shots{display:flex;gap:22px;overflow-x:auto;padding:46px 20px 26px;scroll-snap-type:x mandatory}
.shots img{flex:none;width:260px;height:auto;border-radius:26px;box-shadow:var(--shadow);scroll-snap-align:center;background:#0b6b60}
.shots::-webkit-scrollbar{height:8px}.shots::-webkit-scrollbar-thumb{background:var(--line);border-radius:4px}
.langs{display:flex;flex-wrap:wrap;gap:12px;justify-content:center;margin-top:34px}
.langs a{padding:11px 22px;border-radius:999px;background:var(--surface);border:1px solid var(--line);text-decoration:none;font-weight:700;box-shadow:0 4px 14px rgba(15,31,36,.05)}
.langs a:hover,.langs a[aria-current]{background:var(--brand);border-color:var(--brand);color:#fff}
.band{padding:64px 0;color:#fff;text-align:center;background:linear-gradient(135deg,#0b6b60,#17a08c)}
.band h2{color:#fff}.band p{max-width:40em;margin:14px auto 0;font-size:19px;color:rgba(255,255,255,.92)}
.band .cta{margin-top:26px}
footer{padding:34px 0;background:#0a1417;color:rgba(255,255,255,.75);font-size:15px}
footer .wrap{display:flex;flex-wrap:wrap;gap:14px 28px;align-items:center;justify-content:space-between}
footer a{text-decoration:none}footer a:hover{color:#fff;text-decoration:underline}
@media (max-width:900px){.hero{padding-top:110px}.hero .wrap{grid-template-columns:1fr;text-align:center}.hero .sub{margin-inline:auto}.phones{height:440px;max-width:520px;margin:20px auto 0;width:100%}.phones img{width:200px}.phones img:nth-child(2){width:220px;inset-inline-start:calc(50% - 110px)}nav.links a.nav-link{display:none}}
@media (max-width:480px){.brand span{display:none}.phones{height:380px}.phones img{width:160px}.phones img:nth-child(2){width:180px;inset-inline-start:calc(50% - 90px)}}
`;
writeFileSync(`${OUT}/assets/style.css`, CSS.trim() + '\n');

// ---------------------------------------------------------------- pages
const PLAY_ICON = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#00d2ff" d="M6 4.5v39c0 .9 1 1.4 1.7.9L28 24 7.7 3.6C7 3.1 6 3.6 6 4.5z"/><path fill="#00e676" d="M28 24 7.7 44.4c.2.1.4.1.6.1.3 0 .6-.1.9-.3l24.2-13.9L28 24z"/><path fill="#ffc400" d="m40.6 20.6-7.2-4.1L28 24l5.4 7.5 7.2-4.1c2.1-1.2 2.1-5.6 0-6.8z"/><path fill="#ff3d57" d="M7.7 3.6 28 24l5.4-7.5L9.2 2.6c-.3-.2-.6-.2-.9-.2-.2 0-.4.1-.6.2z"/></svg>`;

function page(lang) {
  const c = content[lang.code];
  const [h1, ctaText, featuresLabel, shotsLabel, langLabel, privacyLabel, freeLine] = UI[lang.code];
  const root = lang.code === 'en' ? '' : '../';
  const shotSet = lang.code === 'ar' ? 'ar' : 'en';
  const canonical = urlFor(lang.code);
  const description = metaDescription(c.intro);
  const play = playUrl(lang.hl);
  const privacy = c.sections.find((s) => s.text && !s.bullets.length);
  const features = c.sections.filter((s) => s !== privacy);
  const href = (code) => (lang.code === code ? './' : `${root}${code === 'en' ? '' : code + '/'}`);

  const hreflangs = LANGS.map((l) => `<link rel="alternate" hreflang="${l.hreflang}" href="${urlFor(l.code)}">`).join('\n  ') +
    `\n  <link rel="alternate" hreflang="x-default" href="${urlFor('en')}">`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: c.name,
    alternateName: 'DiyaQR',
    description: c.intro,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Android',
    inLanguage: lang.hreflang,
    url: canonical,
    downloadUrl: play,
    installUrl: play,
    image: `${SITE_URL}assets/og-image.png`,
    screenshot: [1, 2, 3, 4, 5, 6].map((n) => `${SITE_URL}assets/shots/${shotSet}-${n}.webp`),
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  const altBase = c.name;
  const shots = [1, 2, 3, 4, 5, 6]
    .map((n) => `<img src="${root}assets/shots/${shotSet}-${n}.webp" width="540" height="960" loading="lazy" alt="${esc(altBase)} ${n}/6">`)
    .join('\n      ');

  return `<!doctype html>
<html lang="${lang.hreflang}" dir="${lang.dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(c.name)}</title>
  <meta name="description" content="${esc(description)}">
  <link rel="canonical" href="${canonical}">
  ${hreflangs}
  <meta name="theme-color" content="#0b6b60">
  <link rel="icon" type="image/png" href="${root}assets/favicon.png">
  <link rel="apple-touch-icon" href="${root}assets/icon-192.png">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="DiyaQR">
  <meta property="og:title" content="${esc(c.name)}">
  <meta property="og:description" content="${esc(description)}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${SITE_URL}assets/og-image.png">
  <meta property="og:locale" content="${lang.og}">
  ${LANGS.filter((l) => l !== lang).map((l) => `<meta property="og:locale:alternate" content="${l.og}">`).join('\n  ')}
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${esc(c.name)}">
  <meta name="twitter:description" content="${esc(description)}">
  <meta name="twitter:image" content="${SITE_URL}assets/og-image.png">
  <link rel="stylesheet" href="${root}assets/style.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd)}</script>
</head>
<body>
<header class="top">
  <div class="wrap">
    <a class="brand" href="${href(lang.code)}"><img src="${root}assets/icon-192.png" width="44" height="44" alt="DiyaQR"><span>DiyaQR</span></a>
    <nav class="links">
      <a class="nav-link" href="#features">${esc(featuresLabel)}</a>
      <a class="nav-link" href="#screenshots">${esc(shotsLabel)}</a>
      <details class="lang">
        <summary aria-label="${esc(langLabel)}">🌐 ${esc(lang.name)}</summary>
        <ul>
          ${LANGS.map((l) => `<li><a href="${href(l.code)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${l === lang ? ' aria-current="true"' : ''}>${esc(l.name)}</a></li>`).join('\n          ')}
        </ul>
      </details>
    </nav>
  </div>
</header>

<main>
  <section class="hero">
    <div class="wrap">
      <div>
        <span class="eyebrow">${esc(c.name)}</span>
        <h1>${esc(h1)}</h1>
        <p class="sub">${esc(c.short)}</p>
        <a class="cta" href="${play}" rel="noopener">${PLAY_ICON}<span>${esc(ctaText)}</span></a>
        <p class="free">${esc(freeLine)}</p>
      </div>
      <div class="phones" aria-hidden="true">
        <img src="${root}assets/shots/${shotSet}-3.webp" width="540" height="960" alt="">
        <img src="${root}assets/shots/${shotSet}-1.webp" width="540" height="960" alt="">
        <img src="${root}assets/shots/${shotSet}-2.webp" width="540" height="960" alt="">
      </div>
    </div>
  </section>

  <section class="block" id="features">
    <div class="wrap">
      <h2>${esc(featuresLabel)}</h2>
      <p class="lead">${esc(c.intro)}</p>
      <div class="cards">
        ${features
          .map(
            (s) => `<article class="card">
          <div class="ico" aria-hidden="true">${s.emoji}</div>
          <h3>${esc(niceHeading(s.title, lang.hreflang))}</h3>
          <ul>${s.bullets.map((b) => `<li>${esc(b)}</li>`).join('')}</ul>
        </article>`,
          )
          .join('\n        ')}
      </div>
    </div>
  </section>

  <section class="block" id="screenshots" style="padding-top:0">
    <div class="wrap"><h2>${esc(shotsLabel)}</h2></div>
    <div class="shots">
      ${shots}
    </div>
  </section>

  <section class="block" style="padding-top:20px">
    <div class="wrap">
      <h2>${esc(langLabel)}</h2>
      <div class="langs">
        ${LANGS.map((l) => `<a href="${href(l.code)}" hreflang="${l.hreflang}" lang="${l.hreflang}"${l === lang ? ' aria-current="true"' : ''}>${esc(l.name)}</a>`).join('\n        ')}
      </div>
    </div>
  </section>

  <section class="band">
    <div class="wrap">
      ${privacy ? `<h2>${privacy.emoji} ${esc(niceHeading(privacy.title, lang.hreflang))}</h2><p>${esc(privacy.text)}</p>` : ''}
      <a class="cta" href="${play}" rel="noopener">${PLAY_ICON}<span>${esc(ctaText)}</span></a>
      <p class="free" style="margin-top:18px">${esc(c.closing)}</p>
    </div>
  </section>
</main>

<footer>
  <div class="wrap">
    <span>© ${new Date().getFullYear()} DiyaQR</span>
    <span><a href="${root}policy.html">${esc(privacyLabel)}</a> · <a href="${play}" rel="noopener">Google Play</a></span>
  </div>
</footer>
<script>document.addEventListener('click',function(e){var d=document.querySelector('details.lang');if(d&&d.open&&!d.contains(e.target))d.open=false;});</script>
</body>
</html>
`;
}

for (const lang of LANGS) {
  const dir = lang.code === 'en' ? OUT : `${OUT}/${lang.code}`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(`${dir}/index.html`, page(lang));
}

// ---------------------------------------------------------------- sitemap and robots
const today = new Date().toISOString().slice(0, 10);
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${LANGS.map(
  (l) => `  <url>
    <loc>${urlFor(l.code)}</loc>
    <lastmod>${today}</lastmod>
${LANGS.map((a) => `    <xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${urlFor(a.code)}"/>`).join('\n')}
    <xhtml:link rel="alternate" hreflang="x-default" href="${urlFor('en')}"/>
  </url>`,
).join('\n')}
</urlset>
`;
writeFileSync(`${OUT}/sitemap.xml`, sitemap);
writeFileSync(`${OUT}/robots.txt`, `User-agent: *\nAllow: /\n\nSitemap: ${SITE_URL}sitemap.xml\n`);
console.log(`Website written to ${OUT}/ for ${SITE_URL} (${LANGS.length} languages).`);

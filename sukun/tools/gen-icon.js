/**
 * Uygulama ikonu, Android adaptive ikonu, açılış işareti ve favicon üretir.
 *
 * `node tools/gen-icon.js`
 *
 * **Fikir:** işaret, Kur'an'ın kendi bölüm durağı olan **rub'ül hizb**tir
 * (۞) — iki karenin 45° kaydırılmasıyla çıkan sekizli yıldız. Ortasındaki
 * boşluk tesadüf değil: **sükûn** harekesi (ْ) küçük bir dairedir. Yani işaret
 * hem uygulamanın adını hem de ne iş yaptığını söylüyor.
 *
 * Figüratif öge yok (§9): ne cami, ne Kâbe, ne hilal — motif dili saf geometri.
 *
 * Renkler `src/theme/tokens.ts` paletinden **elle kopyalanmaz**, oradan okunur;
 * palet değişirse ikon da değişir.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const KOK = path.join(__dirname, '..');
const ASSETS = path.join(KOK, 'assets');

/** Playwright'ın indirdiği Chromium; sistemde başka tarayıcı yok. */
function tarayiciYolu() {
  const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dizin = fs.readdirSync(taban).find((d) => /^chromium-\d+$/.test(d));
  if (!dizin) throw new Error(`Chromium bulunamadı: ${taban}`);
  return path.join(taban, dizin, 'chrome-linux', 'chrome');
}

/** tokens.ts saf veridir; TypeScript derlemeden okunabilsin diye ayrıştırılır. */
function palet() {
  const kaynak = fs.readFileSync(path.join(KOK, 'src/theme/tokens.ts'), 'utf8');
  const blok = kaynak.slice(kaynak.indexOf('export const palette'));
  const out = {};
  for (const m of blok.slice(0, blok.indexOf('};')).matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)) {
    out[m[1]] = m[2];
  }
  const gerekli = ['emerald900', 'emerald700', 'gold300', 'gold400', 'gold600'];
  for (const k of gerekli) if (!out[k]) throw new Error(`palette.${k} okunamadı`);
  return out;
}

const P = palet();

/** Merkezi (512,512) olan, çevrel yarıçapı r olan karenin yolu. */
function kare(r, donme) {
  const pts = [];
  for (let i = 0; i < 4; i++) {
    const a = donme + (Math.PI / 2) * i;
    pts.push(`${(512 + r * Math.cos(a)).toFixed(1)},${(512 + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
}

/** Sekizgen petek dokusu — geniş yüzeyde sakin, ikonu bastırmayan doku. */
function doku(adim = 168) {
  const k = adim * 0.2929;
  const yollar = [];
  for (let y = -adim; y < 1024 + adim; y += adim) {
    for (let x = -adim; x < 1024 + adim; x += adim) {
      yollar.push(
        `M${x + k},${y} L${x + adim - k},${y} L${x + adim},${y + k} L${x + adim},${y + adim - k}`
        + ` L${x + adim - k},${y + adim} L${x + k},${y + adim} L${x},${y + adim - k} L${x},${y + k} Z`,
      );
    }
  }
  return yollar.map((d) => `<path d="${d}"/>`).join('');
}

/**
 * @param {object} o
 * @param {boolean} o.zemin  Zümrüt zemin çizilsin mi (Android foreground'da çizilmez).
 * @param {number}  o.r      Yıldızın çevrel yarıçapı.
 */
function svg({ zemin, r }) {
  const bosluk = Math.round(r * 0.28); // sükûn harekesi: ortadaki daire
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="zemin" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${P.emerald700}"/>
      <stop offset="1" stop-color="${P.emerald900}"/>
    </linearGradient>
    <radialGradient id="parlama" cx="0.5" cy="0.38" r="0.62">
      <stop offset="0" stop-color="${P.gold400}" stop-opacity="0.20"/>
      <stop offset="1" stop-color="${P.gold400}" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="altin" x1="0.12" y1="0" x2="0.88" y2="1">
      <stop offset="0" stop-color="${P.gold300}"/>
      <stop offset="0.45" stop-color="${P.gold400}"/>
      <stop offset="1" stop-color="${P.gold600}"/>
    </linearGradient>
    <mask id="hareke">
      <rect width="1024" height="1024" fill="#fff"/>
      <circle cx="512" cy="512" r="${bosluk}" fill="#000"/>
    </mask>
    <filter id="derinlik" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="${Math.round(r * 0.035)}" stdDeviation="${Math.round(r * 0.045)}"
                    flood-color="${P.emerald900}" flood-opacity="0.45"/>
    </filter>
  </defs>

  ${zemin ? `<rect width="1024" height="1024" fill="url(#zemin)"/>
  <g fill="none" stroke="${P.gold400}" stroke-width="2.2" opacity="0.05">${doku()}</g>
  <rect width="1024" height="1024" fill="url(#parlama)"/>` : ''}

  <!-- İki kare TEK yolda birleşir: ayrı <path> olarak çizilince araya gradyan
       dikişi ve iç kontur giriyor, işaret sekizli yıldız yerine "üst üste iki
       kare" gibi okunuyordu. nonzero sarım kuralı birleşimi verir. -->
  <path d="${kare(r, 0)} ${kare(r, Math.PI / 4)}" fill-rule="nonzero"
        fill="url(#altin)" mask="url(#hareke)"${zemin ? ' filter="url(#derinlik)"' : ''}/>
</svg>`;
}

const URETILECEK = [
  // iOS ve mağaza ikonu: saydamlık yok, köşeleri Apple kendisi yuvarlar.
  { ad: 'icon.png', boy: 1024, svg: svg({ zemin: true, r: 322 }) },
  // Android maskesi kenarları kırpar: içerik merkezdeki %66'lık daireye sığmalı.
  { ad: 'adaptive-icon.png', boy: 1024, svg: svg({ zemin: false, r: 296 }) },
  // Açılış ekranı: zemin rengi app.config.ts'ten gelir, burada yalnız işaret.
  { ad: 'splash-icon.png', boy: 1024, svg: svg({ zemin: false, r: 300 }) },
  { ad: 'favicon.png', boy: 96, svg: svg({ zemin: true, r: 360 }) },
];

(async () => {
  fs.mkdirSync(ASSETS, { recursive: true });
  const browser = await chromium.launch({
    executablePath: tarayiciYolu(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const { ad, boy, svg: kaynak } of URETILECEK) {
    const ctx = await browser.newContext({
      viewport: { width: boy, height: boy },
      deviceScaleFactor: 1,
    });
    const page = await ctx.newPage();
    // Saydam PNG: gövde arka planı yok, ekran görüntüsü omitBackground ile alınır.
    await page.setContent(
      `<!doctype html><meta charset="utf-8">
       <style>html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${boy}px;height:${boy}px}</style>${kaynak}`,
      { waitUntil: 'load' },
    );
    await page.screenshot({ path: path.join(ASSETS, ad), omitBackground: true });
    await ctx.close();
    console.log(`${ad.padEnd(20)} ${boy}×${boy}`);
  }

  await browser.close();
})();

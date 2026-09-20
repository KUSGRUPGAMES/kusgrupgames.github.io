/**
 * BEŞ marka varlıklarını üretir — `node tools/gen-brand.js`
 *
 * Tek kaynak: `tools/brand/mark.js`. Koyu ve açık varyant AYNI yolları
 * kullanır; yalnız renk değişir. Böylece iki tema aynı logonun gece/gündüz
 * hâli olur, iki ayrı logo değil.
 *
 * Üretilenler `assets/brand/` altına yazılır; `assets/` kökündeki dosyalar
 * Expo'nun beklediği adlarla oradan kopyalanır (app.config.ts o adları
 * gösterir).
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { BOY, tamYol, ortaYol, mikroYol, desen, kaydirma } = require('./brand/mark');

const KOK = path.join(__dirname, '..');
const ASSETS = path.join(KOK, 'assets');
const BRAND = path.join(ASSETS, 'brand');

function tarayiciYolu() {
  const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dizin = fs.readdirSync(taban).find((d) => /^chromium-\d+$/.test(d));
  if (!dizin) throw new Error(`Chromium bulunamadı: ${taban}`);
  return path.join(taban, dizin, 'chrome-linux', 'chrome');
}

/** Renkler `src/theme/tokens.ts` paletinden okunur; elle kopyalanmaz. */
function palet() {
  const kaynak = fs.readFileSync(path.join(KOK, 'src/theme/tokens.ts'), 'utf8');
  const blok = kaynak.slice(kaynak.indexOf('export const palette'));
  const out = {};
  for (const m of blok.slice(0, blok.indexOf('};')).matchAll(/(\w+):\s*'(#[0-9A-Fa-f]{6})'/g)) {
    out[m[1]] = m[2];
  }
  for (const k of ['emerald900', 'emerald700', 'gold300', 'gold400', 'gold600', 'ivory50', 'ivory200']) {
    if (!out[k]) throw new Error(`palette.${k} okunamadı`);
  }
  return out;
}

const P = palet();

const TEMA = {
  dark: {
    zemin1: P.emerald700, zemin2: P.emerald900,
    isaret1: P.gold300, isaret2: P.gold400, isaret3: P.gold600,
    desen: P.gold400, desenOpak: 0.06,
    yazi: P.ivory50,
  },
  light: {
    zemin1: P.ivory50, zemin2: P.ivory200,
    isaret1: P.emerald700, isaret2: P.emerald900, isaret3: P.emerald900,
    desen: P.emerald700, desenOpak: 0.055,
    yazi: P.emerald900,
  },
};

/**
 * @param {object} o
 * @param {'dark'|'light'} o.tema
 * @param {boolean} o.zemin   Zemin çizilsin mi (Android foreground'da çizilmez).
 * @param {string}  o.yol     Kullanılacak işaret yolu (tam/orta/mikro).
 * @param {number}  o.olcek   İşaretin kutuya göre ölçeği.
 * @param {string=} o.tekRenk Verilirse gradyan yerine düz bu renk kullanılır.
 */
function svg({ tema, zemin, yol, olcek = 1, tekRenk }) {
  const t = TEMA[tema];
  const d = (1 - olcek) * (BOY / 2);
  const dolgu = tekRenk ? tekRenk : 'url(#isaret)';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${BOY}" height="${BOY}" viewBox="0 0 ${BOY} ${BOY}">
  <defs>
    <linearGradient id="zemin" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0" stop-color="${t.zemin1}"/><stop offset="1" stop-color="${t.zemin2}"/>
    </linearGradient>
    <linearGradient id="isaret" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${t.isaret1}"/>
      <stop offset="0.5" stop-color="${t.isaret2}"/>
      <stop offset="1" stop-color="${t.isaret3}"/>
    </linearGradient>
  </defs>
  ${zemin ? `<rect width="${BOY}" height="${BOY}" fill="url(#zemin)"/>
  <g fill="none" stroke="${t.desen}" stroke-width="2" opacity="${t.desenOpak}">
    <path d="${desen()}"/>
  </g>` : ''}
  <g transform="translate(${d.toFixed(1)},${d.toFixed(1)}) scale(${olcek}) ${kaydirma()}">
    <path d="${yol}" fill-rule="nonzero" fill="${dolgu}"/>
  </g>
</svg>`;
}

const URETILECEK = [
  // --- master işaret (zeminsiz, saydam)
  ['brand/symbol-dark.png', 1024, { tema: 'dark', zemin: false, yol: tamYol(), olcek: 0.94 }],
  ['brand/symbol-light.png', 1024, { tema: 'light', zemin: false, yol: tamYol(), olcek: 0.94 }],

  // --- uygulama ikonları (zeminli)
  ['brand/app-icon-dark.png', 1024, { tema: 'dark', zemin: true, yol: tamYol(), olcek: 0.80 }],
  ['brand/app-icon-light.png', 1024, { tema: 'light', zemin: true, yol: tamYol(), olcek: 0.80 }],

  // --- tek renk varyantlar (bildirim, tinted icon, watch)
  ['brand/app-icon-monochrome.png', 1024,
    { tema: 'dark', zemin: false, yol: ortaYol(), olcek: 0.72, tekRenk: '#FFFFFF' }],
  ['brand/symbol-micro-dark.png', 512,
    { tema: 'dark', zemin: false, yol: mikroYol(), olcek: 0.94 }],
  ['brand/symbol-micro-light.png', 512,
    { tema: 'light', zemin: false, yol: mikroYol(), olcek: 0.94 }],

  // --- Expo'nun beklediği adlar
  ['icon.png', 1024, { tema: 'dark', zemin: true, yol: tamYol(), olcek: 0.80 }],
  // Android maskesi kenarları kırpar: içerik merkezdeki %66'lık daireye sığmalı.
  ['adaptive-icon.png', 1024, { tema: 'dark', zemin: false, yol: tamYol(), olcek: 0.62 }],
  ['adaptive-icon-mono.png', 1024,
    { tema: 'dark', zemin: false, yol: ortaYol(), olcek: 0.62, tekRenk: '#FFFFFF' }],
  ['splash-icon.png', 1024, { tema: 'dark', zemin: false, yol: tamYol(), olcek: 0.86 }],
  ['favicon.png', 96, { tema: 'dark', zemin: true, yol: mikroYol(), olcek: 0.82 }],
];

(async () => {
  fs.mkdirSync(BRAND, { recursive: true });
  const browser = await chromium.launch({
    executablePath: tarayiciYolu(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const [ad, boy, secenek] of URETILECEK) {
    const ctx = await browser.newContext({ viewport: { width: boy, height: boy }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>
       html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${boy}px;height:${boy}px}</style>${svg(secenek)}`,
      { waitUntil: 'load' },
    );
    const hedef = path.join(ASSETS, ad);
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    await page.screenshot({ path: hedef, omitBackground: true });
    await ctx.close();
    console.log(`${ad.padEnd(34)} ${boy}×${boy}`);
  }

  // Vektör kaynak: rasterlar buradan üretilir, tersi değil.
  fs.writeFileSync(path.join(BRAND, 'symbol-dark.svg'),
    svg({ tema: 'dark', zemin: false, yol: tamYol(), olcek: 0.94 }));
  fs.writeFileSync(path.join(BRAND, 'symbol-light.svg'),
    svg({ tema: 'light', zemin: false, yol: tamYol(), olcek: 0.94 }));
  fs.writeFileSync(path.join(BRAND, 'app-icon-dark.svg'),
    svg({ tema: 'dark', zemin: true, yol: tamYol(), olcek: 0.80 }));
  fs.writeFileSync(path.join(BRAND, 'app-icon-light.svg'),
    svg({ tema: 'light', zemin: true, yol: tamYol(), olcek: 0.80 }));
  console.log('brand/*.svg           vektör kaynak');

  await browser.close();
})();

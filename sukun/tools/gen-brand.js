/**
 * Platform ikonlarını **verilen marka paketinden** üretir.
 *
 *     node tools/gen-brand.js
 *
 * **Kaynak `assets/brand/svg/` altındaki dosyalardır.** Burada hiçbir şey
 * çizilmez, izlenmez, yeniden yorumlanmaz: yalnız verilen vektörler Expo'nun
 * beklediği adlara ve boyutlara rasterlenir (CLAUDE_HANDOFF kuralı 8).
 *
 * İki teknik uyarlama vardır, ikisi de kılavuzun kendi maddesi:
 *
 * 1. **iOS ikonunda yuvarlak köşe kaldırılır.** Verilen master `rx="220"`
 *    taşıyor; Apple ikona kendi maskesini uyguluyor ve iki yuvarlama üst üste
 *    binince köşelerde açık renk bir hâle kalıyor. Kural 3 bunu açıkça
 *    yasaklıyor. Yalnız zemin dikdörtgeninin köşe yarıçapı sıfırlanır —
 *    sembol geometrisine dokunulmaz, kaynak dosya değişmez.
 * 2. **Android uyarlanabilir ikon zemini** paketin Deep Emerald'ı ile doldurulur
 *    (kural 4); verilen foreground saydamdır.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');

const KOK = path.join(__dirname, '..');
const ASSETS = path.join(KOK, 'assets');
const SVG = path.join(ASSETS, 'brand', 'svg');

const TOKENS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'brand', 'brand.tokens.json'), 'utf8'));

function tarayiciYolu() {
  const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dizin = fs.readdirSync(taban).find((d) => /^chromium-\d+$/.test(d));
  if (!dizin) throw new Error(`Chromium bulunamadı: ${taban}`);
  return path.join(taban, dizin, 'chrome-linux', 'chrome');
}

const oku = (ad) => fs.readFileSync(path.join(SVG, ad), 'utf8');

/** Zemin dikdörtgeninin köşe yarıçapını sıfırlar (yalnız iOS ikonu için). */
const koseleriDuzle = (svg) => svg.replace(/rx="220"/g, 'rx="0"');

/** Saydam vektörün arkasına düz zemin koyar. */
const zeminEkle = (svg, renk) => svg.replace(
  /(<svg[^>]*>)/,
  `$1<rect x="-9999" y="-9999" width="99999" height="99999" fill="${renk}"/>`,
);

const URETILECEK = [
  // --- iOS ve mağaza ikonu: tam kare, saydamlık yok, köşeyi Apple yuvarlar.
  { ad: 'icon.png', boy: 1024, svg: koseleriDuzle(oku('BES_AppIcon_Dark.svg')) },
  {
    ad: 'brand/app-icon-ios-light.png',
    boy: 1024,
    svg: koseleriDuzle(oku('BES_AppIcon_Light.svg')),
  },

  // --- Android uyarlanabilir ikon: verilen foreground + paketin zümrüt zemini.
  { ad: 'adaptive-icon.png', boy: 1024, svg: oku('BES_Android_Adaptive_Foreground.svg') },
  // Android 13+ temalı ikon ve bildirim rozeti: tek renk siluet.
  { ad: 'adaptive-icon-mono.png', boy: 1024, svg: oku('BES_Android_Notification_Monochrome.svg') },
  // Bildirim küçük ikonu ayrı bir ada da yazılır; Android bunu alfa kanalından
  // siluet olarak okur ve sistem rengiyle boyar.
  { ad: 'brand/notification-icon.png', boy: 512, svg: oku('BES_Android_Notification_Monochrome.svg') },

  // --- Açılış ekranı: saydam sembol, zemin rengi app.config.ts'ten gelir.
  { ad: 'splash-icon.png', boy: 1024, svg: oku('BES_Symbol_Gold.svg') },
  { ad: 'brand/splash-icon-light.png', boy: 1024, svg: oku('BES_Symbol_Emerald.svg') },

  // --- Küçük yüzeyler (Watch complication, Dynamic Island, liste rozeti):
  // kural 10 — ayrıntılı cami yerine sadeleşmiş tek renk sembol.
  { ad: 'brand/symbol-micro-light.png', boy: 256, svg: oku('BES_Symbol_Monochrome_White.svg') },
  { ad: 'brand/symbol-micro-dark.png', boy: 256, svg: oku('BES_Symbol_Monochrome_Black.svg') },

  // --- Marka deseni (hero yüzeyleri, widget, Live Activity zeminleri)
  { ad: 'brand/pattern-dark.png', boy: 512, svg: oku('BES_Pattern_Dark.svg') },
  { ad: 'brand/pattern-light.png', boy: 512, svg: oku('BES_Pattern_Light.svg') },

  {
    ad: 'favicon.png',
    boy: 96,
    svg: zeminEkle(oku('BES_Symbol_Gold.svg'), TOKENS.colors.deepEmerald),
  },
];

(async () => {
  const browser = await chromium.launch({
    executablePath: tarayiciYolu(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  for (const { ad, boy, svg } of URETILECEK) {
    const ctx = await browser.newContext({ viewport: { width: boy, height: boy }, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    await page.setContent(
      `<!doctype html><meta charset="utf-8"><style>
       html,body{margin:0;padding:0;background:transparent}
       svg{display:block;width:${boy}px;height:${boy}px}</style>${svg}`,
      { waitUntil: 'load' },
    );
    const hedef = path.join(ASSETS, ad);
    fs.mkdirSync(path.dirname(hedef), { recursive: true });
    await page.screenshot({ path: hedef, omitBackground: true });
    await ctx.close();
    console.log(`${ad.padEnd(34)} ${boy}×${boy}`);
  }

  await browser.close();
  console.log(`\nKaynak: assets/brand/svg/ — ${TOKENS.brandName} paketi, olduğu gibi.`);
})();

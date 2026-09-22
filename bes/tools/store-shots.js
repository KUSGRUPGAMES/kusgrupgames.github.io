/**
 * Mağaza ekran görüntülerini üretir — App Store ve Play Console boyutlarında.
 *
 *     npm run store:shots
 *
 * Neden ayrı bir üretici: `preview.js` **denetim** için çiziyor (ham ekran,
 * dört geçiş, hata avı). Mağaza karesi başka bir şeydir — üstte bir başlık,
 * altta cihaz çerçevesi içinde ekran, markanın zemini. İkisini tek betiğe
 * sıkıştırmak ikisini de bozuyordu.
 *
 * Boyutlar (2026 itibarıyla iki konsolun istediği):
 *
 * | Hedef | Ölçü | Not |
 * |---|---|---|
 * | App Store 6.9" / 6.7" | 1290 × 2796 | iPhone 16 Pro Max kuşağı; tek set yeterli |
 * | Play telefon | 1080 × 1920 | en az 2, en çok 8 kare |
 * | Play öne çıkan görsel | 1024 × 500 | listede zorunlu |
 *
 * Kareler **gerçek uygulamadan** gelir: `.expo/shots/acik` ve `koyu`
 * altındaki denetim kareleri yeniden çizilmez, olduğu gibi çerçevelenir.
 * Uydurma ekran, mağaza reddi sebebidir ve zaten dürüst değildir.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('playwright-core');
const { PNG } = require('pngjs');

const KOK = path.join(__dirname, '..');
const KAYNAK = path.join(KOK, '.expo', 'shots');
// Depoya yazılır: kullanıcı bu dosyaları konsola yükleyecek, `.expo/`
// gitignore'da olduğu için oradan çıkaramaz.
const CIKTI = path.join(KOK, 'store', 'screenshots');

const MARKA = JSON.parse(fs.readFileSync(path.join(KOK, 'src/config/brand.json'), 'utf8'));
const T = JSON.parse(fs.readFileSync(path.join(KOK, 'assets/brand/brand.tokens.json'), 'utf8'));

/** Ölçülen marka renkleri (DECISIONS D18) — tema dosyasıyla aynı değerler. */
const ZEMIN_UST = '#042B21';
const ZEMIN_ALT = '#000D08';
const FILDISI = '#FBF6EC';
const ALTIN = '#D3B685';

function tarayiciYolu() {
  const taban = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers';
  const dizin = fs.readdirSync(taban).find((d) => /^chromium-\d+$/.test(d));
  if (!dizin) throw new Error(`Chromium bulunamadı: ${taban}`);
  return path.join(taban, dizin, 'chrome-linux', 'chrome');
}

/**
 * Yedi kare, `store/app-store.md` içindeki hikâye sırasıyla. İlk iki kare
 * mağazada kaydırmadan görünür; en güçlü iki ekran oraya konur.
 */
const KARELER = [
  { dosya: 'acik/10-ana-sayfa.png', baslik: 'Vakti hiç kaçırma', alt: 'Geri sayım, altı vakit, aylık takvim' },
  { dosya: 'acik/20-okuyucu.png', baslik: 'Kur’an-ı Kerim', alt: 'Arapça, Elmalılı meali, 18 okuyucu' },
  // Kıble ekranı bilerek seçilmedi: tarayıcıda pusula olmadığı için kare
  // "Pusula okunamıyor" uyarısıyla çıkıyor ve mağazada kusur gibi duruyor.
  // Özellik açıklamada anlatılıyor; gerçek cihazda kare çekilince eklenir.
  { dosya: 'acik/40-vakit-takvimi.png', baslik: 'Ay boyu takvim', alt: 'Otuz günün altı vakti tek ekranda' },
  { dosya: 'acik/31-zikir.png', baslik: 'Zikirmatik', alt: 'Hedef, seri takibi, istatistik' },
  { dosya: 'koyu/10-ana-sayfa.png', baslik: 'Koyu tema', alt: 'Gece okumak için dinlendirici' },
  { dosya: 'acik/54-ramazan.png', baslik: 'Ramazan', alt: 'İmsaktan iftara, ay boyu imsakiye' },
  { dosya: 'acik/51-ibadet-gunlugu.png', baslik: 'İbadet defteri', alt: 'Kaza, oruç, hatim — hepsi telefonunda' },
];

const HEDEFLER = [
  { ad: 'app-store-6.9', w: 1290, h: 2796 },
  { ad: 'play-telefon', w: 1080, h: 1920 },
];

const kacis = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Görseli `data:` olarak gömer.
 *
 * `setContent` ile açılan sayfanın kaynağı `about:blank`; oradan `file://`
 * okunamıyor ve resimler kırık çıkıyordu (bir kez bu yüzden bomboş çerçeveli
 * kareler üretildi). Gömülü veri bu sorunu tamamen ortadan kaldırıyor.
 */
const gomulu = (yol) => `data:image/png;base64,${fs.readFileSync(yol).toString('base64')}`;

/** Tek bir mağaza karesinin HTML'i. */
function kareHtml({ w, h, baslik, alt, resim }) {
  // Ölçüler hedef genişliğe göre oranlanır; 1290 ve 1080 için ayrı sayı
  // yazmak yerine tek bir oran kullanılır.
  const k = w / 1290;
  const yaziAlani = Math.round(560 * k);
  const cerceve = Math.round(14 * k);
  const radius = Math.round(64 * k);
  return `<!doctype html><meta charset="utf-8"><style>
  @font-face{font-family:sys;src:local('DejaVu Sans')}
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;
       background:linear-gradient(180deg,${ZEMIN_UST} 0%,${ZEMIN_ALT} 100%);
       font-family:system-ui,-apple-system,'DejaVu Sans',sans-serif;
       display:flex;flex-direction:column;align-items:center}
  .yazi{height:${yaziAlani}px;display:flex;flex-direction:column;justify-content:center;
        align-items:center;text-align:center;padding:0 ${Math.round(90 * k)}px}
  h1{color:${FILDISI};font-size:${Math.round(86 * k)}px;line-height:1.12;font-weight:800;
     letter-spacing:${Math.round(-1 * k)}px}
  p{color:${ALTIN};font-size:${Math.round(40 * k)}px;line-height:1.35;margin-top:${Math.round(26 * k)}px;font-weight:500}
  .telefon{background:${FILDISI};padding:${cerceve}px;border-radius:${radius}px;
           box-shadow:0 ${Math.round(40 * k)}px ${Math.round(90 * k)}px rgba(0,0,0,.45)}
  .telefon img{display:block;border-radius:${radius - cerceve}px;
               height:${h - yaziAlani - Math.round(210 * k)}px;width:auto}
  </style>
  <div class="yazi"><h1>${kacis(baslik)}</h1><p>${kacis(alt)}</p></div>
  <div class="telefon"><img src="${gomulu(resim)}"></div>`;
}

/** Play listesinin öne çıkan görseli: metin yok, yalnız marka. */
function ozellikHtml(w, h, logo) {
  return `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;
       background:linear-gradient(120deg,${ZEMIN_UST} 0%,${ZEMIN_ALT} 100%);
       font-family:system-ui,-apple-system,'DejaVu Sans',sans-serif;
       display:flex;align-items:center;justify-content:center;gap:40px}
  img{height:250px;width:auto}
  .ad{color:${FILDISI};font-size:96px;font-weight:800;letter-spacing:6px}
  .slogan{color:${ALTIN};font-size:30px;margin-top:10px;font-weight:500}
  </style>
  <img src="${gomulu(logo)}">
  <div><div class="ad">${kacis(MARKA.appName)}</div>
  <div class="slogan">${kacis(MARKA.tagline)}</div></div>`;
}

(async () => {
  if (!fs.existsSync(path.join(KAYNAK, 'acik'))) {
    console.error(`Denetim kareleri yok: ${KAYNAK}\n  npm run preview`);
    process.exit(1);
  }
  fs.mkdirSync(CIKTI, { recursive: true });
  const browser = await chromium.launch({
    executablePath: tarayiciYolu(),
    args: ['--no-sandbox', '--disable-gpu'],
  });

  let sayi = 0;
  for (const hedef of HEDEFLER) {
    const dizin = path.join(CIKTI, hedef.ad);
    fs.mkdirSync(dizin, { recursive: true });
    for (const [i, kare] of KARELER.entries()) {
      const resim = path.join(KAYNAK, kare.dosya);
      if (!fs.existsSync(resim)) throw new Error(`kaynak kare yok: ${resim}`);
      const page = await browser.newPage({ viewport: { width: hedef.w, height: hedef.h } });
      await page.setContent(kareHtml({ ...hedef, ...kare, resim }), { waitUntil: 'load' });
      await page.waitForTimeout(400);
      const ad = `${String(i + 1).padStart(2, '0')}-${kare.baslik.toLowerCase().replace(/[^a-z0-9]+/gi, '-')}.png`;
      await page.screenshot({ path: path.join(dizin, ad) });
      await page.close();
      sayi += 1;
    }
    console.log(`${hedef.ad.padEnd(16)} ${KARELER.length} kare  ${hedef.w}×${hedef.h}`);
  }

  // Play liste ikonu: konsol 512×512 istiyor, uygulama ikonu 1024.
  {
    const png = PNG.sync.read(fs.readFileSync(path.join(KOK, 'assets', 'icon.png')));
    const kucuk = new PNG({ width: 512, height: 512 });
    for (let y = 0; y < 512; y += 1) {
      for (let x = 0; x < 512; x += 1) {
        const hedefIdx = (y * 512 + x) * 4;
        // 1024 → 512: her hedef piksel 2×2 kaynak pikselin ortalaması.
        let r = 0; let g = 0; let b = 0;
        for (let dy = 0; dy < 2; dy += 1) {
          for (let dx = 0; dx < 2; dx += 1) {
            const i = ((y * 2 + dy) * png.width + (x * 2 + dx)) * 4;
            r += png.data[i]; g += png.data[i + 1]; b += png.data[i + 2];
          }
        }
        kucuk.data[hedefIdx] = Math.round(r / 4);
        kucuk.data[hedefIdx + 1] = Math.round(g / 4);
        kucuk.data[hedefIdx + 2] = Math.round(b / 4);
        kucuk.data[hedefIdx + 3] = 255;
      }
    }
    fs.writeFileSync(path.join(CIKTI, 'play-liste-ikonu-512.png'), PNG.sync.write(kucuk, { colorType: 2 }));
    sayi += 1;
    console.log('play-liste-ikonu  1 kare  512×512');
  }

  // Play öne çıkan görsel
  {
    const page = await browser.newPage({ viewport: { width: 1024, height: 500 } });
    await page.setContent(ozellikHtml(1024, 500, path.join(KOK, 'assets/splash-icon.png')), { waitUntil: 'load' });
    await page.waitForTimeout(400);
    await page.screenshot({ path: path.join(CIKTI, 'play-one-cikan-1024x500.png') });
    await page.close();
    sayi += 1;
    console.log('play-öne-çıkan    1 kare  1024×500');
  }

  await browser.close();
  console.log(`\n${sayi} mağaza karesi: ${CIKTI}`);
})();

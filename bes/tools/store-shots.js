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
  { dosya: 'acik/10-ana-sayfa.png', baslik: 'Vakti hiç kaçırma', alt: 'Beş vakit, saniye saniye geri sayım', etiket: 'NAMAZ VAKİTLERİ' },
  { dosya: 'acik/20-okuyucu.png', baslik: 'Kur’an-ı Kerim', alt: '6.236 âyet, Elmalılı meali, 18 okuyucu', etiket: 'KUR’AN' },
  // Kıble ekranı bilerek seçilmedi: tarayıcıda pusula olmadığı için kare
  // "Pusula okunamıyor" uyarısıyla çıkıyor ve mağazada kusur gibi duruyor.
  // Özellik açıklamada anlatılıyor; gerçek cihazda kare çekilince eklenir.
  { dosya: 'acik/40-vakit-takvimi.png', baslik: 'Ay boyu takvim', alt: 'Otuz günün vakitleri tek ekranda', etiket: 'TAKVİM' },
  { dosya: 'acik/31-zikir.png', baslik: 'Zikirmatik', alt: 'Hedef belirle, seriyi sürdür', etiket: 'ZİKİR' },
  { dosya: 'koyu/10-ana-sayfa.png', baslik: 'Koyu tema', alt: 'Gece okumak için dinlendirici', etiket: 'GÖRÜNÜM' },
  { dosya: 'acik/54-ramazan.png', baslik: 'Ramazan', alt: 'İmsaktan iftara, ay boyu imsakiye', etiket: 'RAMAZAN' },
  { dosya: 'acik/51-ibadet-gunlugu.png', baslik: 'İbadet defteri', alt: 'Kaza, oruç ve hatim tek yerde', etiket: 'TAKİP' },
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

/**
 * Arka plan deseni — uygulamanın kendi sekiz köşeli yıldız örgüsü (rub'ül
 * hizb geometrisi: üst üste binmiş iki kare), çok düşük opaklıkta.
 *
 * **Bu bir kez yanlış çizildi.** Burada elmas + çapraz çizgilerden oluşan bir
 * kafes vardı; İslam bezemesiyle ilgisi yoktu, jenerik bir "argyle" desenidir.
 * Uygulamanın içindeki motifle aynı geometri kullanılır ki mağaza karesi ile
 * uygulama aynı dili konuşsun (src/ui/motif/patterns.ts).
 *
 * Yıldız karonun merkezine **ve dört köşesine** konur: örgü karo sınırında
 * kesilip komşu karoda devam eder, desen sürekli okunur.
 */
function desen(k) {
  const a = Math.round(150 * k);
  const r = a * 0.34;
  const kare = (cx, cy, rot) => {
    const pts = [];
    for (let i = 0; i < 4; i += 1) {
      const t = rot + (Math.PI / 2) * i;
      pts.push(`${(cx + r * Math.cos(t)).toFixed(1)},${(cy + r * Math.sin(t)).toFixed(1)}`);
    }
    return `M${pts.join('L')}Z`;
  };
  const merkezler = [[a / 2, a / 2], [0, 0], [a, 0], [0, a], [a, a]];
  const yollar = merkezler
    .flatMap(([cx, cy]) => [kare(cx, cy, Math.PI / 4), kare(cx, cy, 0)])
    .map((d) => `<path d="${d}"/>`)
    .join('');
  return `<svg class="desen" xmlns="http://www.w3.org/2000/svg"><defs>
    <pattern id="p" width="${a}" height="${a}" patternUnits="userSpaceOnUse">
      <g fill="none" stroke="${ALTIN}" stroke-width="${Math.max(1, 1.6 * k)}">${yollar}</g>
    </pattern></defs>
    <rect width="100%" height="100%" fill="url(#p)"/></svg>`;
}

/**
 * Tek bir mağaza karesi.
 *
 * Düzen (yukarıdan aşağı): küçük altın etiket, başlık, altın çizgi, alt
 * başlık, sonra cihaz.
 *
 * **Cihaz alttan taşar.** İlk denemede telefon kareye tam sığıyordu ve iki
 * şey birden bozuluyordu: altta amaçsız bir boşluk kalıyor, ekranın en
 * altındaki kart (ana sayfada "Hicrî takvim") sekme çubuğunun hemen üstünde
 * **yazının ortasından** kesiliyordu. Telefonun içinde yarıda kalan bir
 * satır çizim hatası gibi duruyor. Taşırınca kesme karenin kenarında
 * oluyor — bu, App Store karelerinin standart kalıbı ve uygulamanın
 * kaydırılabilir olduğunu anlatıyor.
 *
 * Geometri iki hedefte farklı orandan (1290×2796 = 2.17, 1080×1920 = 1.78)
 * türediği için cihaz **yükseklikten** hesaplanır, tek bir ölçekten değil:
 * metin alanı karenin %30'u, ekranın %89'u görünür, kalan %11 alttan taşar.
 * Sabit bir ölçek kullanıldığında App Store karesinde boşluk kalıyor,
 * Play karesinde ekranın dörtte biri kesiliyordu.
 *
 * Cihaz çerçevesi koyu: önceki fildişi çerçeve ekranın etrafında beyaz bir
 * şerit bırakıyordu; gerçek telefon gibi durmuyordu.
 */
const KAYNAK_ORAN = 1688 / 780;        // denetim karelerinin en-boy oranı
const GORUNEN = 0.89;                   // ekranın görünen kısmı; kalanı taşar
const METIN_ORANI = 0.30;               // karenin üst %30'u metne ayrılır

function kareHtml({ w, h, baslik, alt, etiket, resim }) {
  const k = w / 1290;                   // tipografi tek orandan türer
  const bezel = Math.round(16 * k);
  const radius = Math.round(76 * k);
  const yaziAlani = Math.round(METIN_ORANI * h);
  // Görünen ekran yüksekliği karenin altına kadar uzanır; tam yükseklik
  // bundan GORUNEN oranıyla geri hesaplanır, genişlik de ondan.
  const ekranTam = (h - yaziAlani - bezel) / GORUNEN;
  const cihazGen = Math.round(ekranTam / KAYNAK_ORAN) + 2 * bezel;
  return `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;position:relative;
       background:
         radial-gradient(120% 60% at 50% 74%, rgba(211,182,133,.16) 0%, rgba(211,182,133,0) 60%),
         linear-gradient(180deg,${ZEMIN_UST} 0%, #02180F 55%, ${ZEMIN_ALT} 100%);
       font-family:system-ui,-apple-system,'DejaVu Sans',sans-serif}
  .desen{position:absolute;inset:0;width:100%;height:100%;opacity:.055}
  .yazi{position:relative;height:${yaziAlani}px;display:flex;flex-direction:column;
        justify-content:center;align-items:center;text-align:center;
        padding:0 ${Math.round(96 * k)}px}
  .etiket{color:${ALTIN};font-size:${Math.round(30 * k)}px;font-weight:700;
          letter-spacing:${Math.round(6 * k)}px;opacity:.92}
  h1{color:${FILDISI};font-size:${Math.round(92 * k)}px;line-height:1.08;font-weight:800;
     letter-spacing:${Math.round(-1.5 * k)}px;margin-top:${Math.round(22 * k)}px}
  .cizgi{width:${Math.round(96 * k)}px;height:${Math.max(2, Math.round(4 * k))}px;
         background:${ALTIN};border-radius:99px;margin:${Math.round(30 * k)}px 0}
  p{color:rgba(251,246,236,.78);font-size:${Math.round(40 * k)}px;line-height:1.35;font-weight:500}
  .cihaz{position:absolute;left:50%;transform:translateX(-50%);
         top:${yaziAlani}px;width:${cihazGen}px;padding:${bezel}px ${bezel}px 0;
         background:linear-gradient(160deg,#123A2E 0%,#04150F 60%);
         border-radius:${radius}px ${radius}px 0 0;
         box-shadow:0 ${Math.round(46 * k)}px ${Math.round(110 * k)}px rgba(0,0,0,.55),
                    inset 0 0 0 ${Math.max(1, Math.round(2 * k))}px rgba(211,182,133,.22)}
  .cihaz img{display:block;width:100%;border-radius:${radius - bezel}px ${radius - bezel}px 0 0}
  </style>
  ${desen(k)}
  <div class="yazi">
    <div class="etiket">${kacis(etiket)}</div>
    <h1>${kacis(baslik)}</h1>
    <div class="cizgi"></div>
    <p>${kacis(alt)}</p>
  </div>
  <div class="cihaz"><img src="${gomulu(resim)}"></div>`;
}

/**
 * Play listesinin öne çıkan görseli: 1024×500, metin az, marka net.
 * Logo master PNG'den gelir, kodla çizilmez (D17).
 */
function ozellikHtml(w, h, logo) {
  const k = w / 1024;
  return `<!doctype html><meta charset="utf-8"><style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:${w}px;height:${h}px;overflow:hidden;position:relative;
       background:
         radial-gradient(70% 120% at 26% 50%, rgba(211,182,133,.18) 0%, rgba(211,182,133,0) 62%),
         linear-gradient(120deg,${ZEMIN_UST} 0%, #02180F 58%, ${ZEMIN_ALT} 100%);
       font-family:system-ui,-apple-system,'DejaVu Sans',sans-serif;
       display:flex;align-items:center;justify-content:center;gap:${Math.round(56 * k)}px}
  .desen{position:absolute;inset:0;width:100%;height:100%;opacity:.05}
  .mark{position:relative;height:${Math.round(272 * k)}px;width:auto}
  .sag{position:relative}
  .ad{color:${FILDISI};font-size:${Math.round(104 * k)}px;font-weight:800;
      letter-spacing:${Math.round(8 * k)}px;line-height:1}
  .cizgi{width:${Math.round(72 * k)}px;height:${Math.max(2, Math.round(4 * k))}px;
         background:${ALTIN};border-radius:99px;margin:${Math.round(18 * k)}px 0}
  .slogan{color:rgba(251,246,236,.82);font-size:${Math.round(30 * k)}px;font-weight:500;
          letter-spacing:${Math.round(0.5 * k)}px}
  </style>
  ${desen(k * 1.6)}
  <img class="mark" src="${gomulu(logo)}">
  <div class="sag">
    <div class="ad">${kacis(MARKA.appName)}</div>
    <div class="cizgi"></div>
    <div class="slogan">${kacis(MARKA.tagline)}</div>
  </div>`;
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

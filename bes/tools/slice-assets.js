/**
 * Marka sayfalarını tek tek parçalara ayırır.
 *
 *     node tools/slice-assets.js
 *
 * Marka sahibi varlıkları bazen **sayfa sayfa** gönderiyor: bir PNG'de onlarca
 * ikon, çerçeve ya da silüet yan yana duruyor. Uygulama bunları tek tek istiyor.
 *
 * Şu anki paket (`assets/brand/paket/`) zaten tek tek geldi; bu betik bir
 * sonraki sayfa partisi için duruyor. Kaynak klasörü yoksa sessizce çıkar.
 *
 * Kesim **elle kırpılmaz**: parçalar saydam zeminle ayrıldığı için birbirine
 * değmeyen opak piksel kümeleri (bağlantılı bileşenler) bulunur ve her küme
 * kendi sınır kutusuyla kesilir. Elle koordinat yazmak, sayfa bir daha
 * üretildiğinde sessizce yanlış yerden keserdi.
 *
 * Özyineleme yerine yığın kullanılır: 1.5 milyon piksellik bir sayfada
 * özyinelemeli dolgu çağrı yığınını taşırıyor.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const KOK = path.join(__dirname, '..');
const KAYNAK = path.join(KOK, 'assets', 'brand', 'gelen');
const CIKTI = path.join(KOK, 'assets', 'brand', 'parca');

/** Opak sayılma eşiği. Kenarlardaki yumuşak geçiş parça sayılmamalı. */
const ALFA_ESIK = 24;
/** Bundan küçük kümeler gürültüdür (tek piksel artıkları, gölge lekeleri). */
const EN_KUCUK_ALAN = 900;

/** Bir sayfadaki bağlantılı opak bölgeleri bulur. */
function parcalar(png) {
  const { width: w, height: h, data } = png;
  const gorulen = new Uint8Array(w * h);
  const opak = (i) => data[i * 4 + 3] >= ALFA_ESIK;
  const bulunan = [];

  for (let bas = 0; bas < w * h; bas += 1) {
    if (gorulen[bas] || !opak(bas)) continue;
    let x0 = bas % w, x1 = x0, y0 = Math.floor(bas / w), y1 = y0, alan = 0;
    const yigin = [bas];
    gorulen[bas] = 1;
    while (yigin.length) {
      const i = yigin.pop();
      const x = i % w, y = (i - x) / w;
      alan += 1;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
      // Sekiz komşu: köşeden değen ince altın hatlar dört komşuda kopuyor.
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (gorulen[j] || !opak(j)) continue;
          gorulen[j] = 1;
          yigin.push(j);
        }
      }
    }
    if (alan >= EN_KUCUK_ALAN) bulunan.push({ x0, y0, x1, y1, alan });
  }
  // Okuma sırası: üstten alta, soldan sağa. Satır toleransı parça
  // yüksekliğinin yarısı — aynı satırdaki parçalar birkaç piksel kaysa da
  // aynı satırda kalsın.
  const ortYukseklik = bulunan.reduce((a, p) => a + (p.y1 - p.y0), 0) / Math.max(1, bulunan.length);
  bulunan.sort((a, b) => (
    Math.abs(a.y0 - b.y0) > ortYukseklik * 0.5 ? a.y0 - b.y0 : a.x0 - b.x0
  ));
  return bulunan;
}

function kes(png, { x0, y0, x1, y1 }) {
  const w = x1 - x0 + 1, h = y1 - y0 + 1;
  const o = new PNG({ width: w, height: h });
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const s = ((y0 + y) * png.width + (x0 + x)) * 4;
      const d = (y * w + x) * 4;
      o.data[d] = png.data[s];
      o.data[d + 1] = png.data[s + 1];
      o.data[d + 2] = png.data[s + 2];
      o.data[d + 3] = png.data[s + 3];
    }
  }
  return o;
}

if (!fs.existsSync(KAYNAK)) {
  console.log(`Kesilecek sayfa yok: ${KAYNAK}`);
  process.exit(0);
}
const sayfalar = fs.readdirSync(KAYNAK).filter((f) => f.endsWith('.png')).sort();
fs.mkdirSync(CIKTI, { recursive: true });
let toplam = 0;
for (const sayfa of sayfalar) {
  const ad = path.basename(sayfa, '.png');
  const png = PNG.sync.read(fs.readFileSync(path.join(KAYNAK, sayfa)));
  const bulunan = parcalar(png);
  const klasor = path.join(CIKTI, ad);
  fs.mkdirSync(klasor, { recursive: true });
  for (const f of fs.readdirSync(klasor)) fs.unlinkSync(path.join(klasor, f));
  bulunan.forEach((p, i) => {
    const no = String(i + 1).padStart(2, '0');
    const dosya = path.join(klasor, `${no}-${p.x1 - p.x0 + 1}x${p.y1 - p.y0 + 1}.png`);
    fs.writeFileSync(dosya, PNG.sync.write(kes(png, p)));
  });
  toplam += bulunan.length;
  console.log(`${ad.padEnd(20)} ${String(bulunan.length).padStart(3)} parça`);
}
console.log(`\nToplam ${toplam} parça: ${CIKTI}`);

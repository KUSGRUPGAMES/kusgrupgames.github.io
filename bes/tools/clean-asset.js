/**
 * Marka varlıklarındaki kesim artıklarını temizler.
 *
 *     node tools/clean-asset.js
 *
 * Varlıklar tek tek geliyor ama bazıları kaynak sayfadan **komşu parça
 * artığı** taşıyor. `ui_varliklari_01` (kemer alınlığı) tam olarak böyleydi:
 * sayfada altında duran üç dairenin tepeleri kesime dahil olmuş ve kartın
 * ortasında üç serbest yay parçası olarak görünüyordu. Bu benim yerleşim
 * hatam sanılıp iki tur boşa gitti; sorun varlığın kendisindeydi.
 *
 * Temizlik kuralı basit ve güvenli: **yalnız en büyük bağlantılı bileşen
 * kalır.** Artıklar ana çizimden ayrı durduğu için kendiliğinden düşer.
 * Ana çizime değen bir artık olsaydı bu yöntem onu alamazdı; öyle bir durumda
 * varlığın yeniden üretilmesi gerekir, elle silme değil.
 *
 * Çıktı `assets/brand/temiz/` altına yazılır; kaynak dosyaya dokunulmaz.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const KOK = path.join(__dirname, '..');
const KAYNAK = path.join(KOK, 'assets', 'brand', 'paket');
const CIKTI = path.join(KOK, 'assets', 'brand', 'temiz');

/** Temizlenecek varlıklar: dosya adı → çıktı adı. */
const LISTE = {
  ui_varliklari_01: 'alinlik',
  ui_varliklari_05: 'kose-sol',
  ui_varliklari_06: 'kose-sag',
};

const ALFA_ESIK = 24;

/** En büyük bağlantılı bileşen dışındaki her şeyi saydamlaştırır. */
function temizle(png) {
  const { width: w, height: h, data } = png;
  const grup = new Int32Array(w * h).fill(-1);
  const opak = (i) => data[i * 4 + 3] > ALFA_ESIK;
  const bilesenler = [];

  for (let bas = 0; bas < w * h; bas += 1) {
    if (grup[bas] >= 0 || !opak(bas)) continue;
    const id = bilesenler.length;
    const yigin = [bas];
    grup[bas] = id;
    let n = 0;
    while (yigin.length) {
      const i = yigin.pop();
      const x = i % w, y = (i - x) / w;
      n += 1;
      for (let dy = -1; dy <= 1; dy += 1) {
        for (let dx = -1; dx <= 1; dx += 1) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          const j = ny * w + nx;
          if (grup[j] >= 0 || !opak(j)) continue;
          grup[j] = id;
          yigin.push(j);
        }
      }
    }
    bilesenler.push({ id, n });
  }
  if (bilesenler.length <= 1) return { atilan: 0, png };

  const enBuyuk = bilesenler.reduce((a, b) => (b.n > a.n ? b : a)).id;
  let atilan = 0;
  for (let i = 0; i < w * h; i += 1) {
    if (grup[i] >= 0 && grup[i] !== enBuyuk) {
      data[i * 4 + 3] = 0;
      atilan += 1;
    }
  }
  return { atilan, png };
}

/** Saydam kenar boşluğunu kırpar: artık düştükten sonra kutu küçülür. */
function kirp(png) {
  const { width: w, height: h, data } = png;
  let x0 = w, x1 = -1, y0 = h, y1 = -1;
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      if (data[(y * w + x) * 4 + 3] <= ALFA_ESIK) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  if (x1 < 0) return png;
  const nw = x1 - x0 + 1, nh = y1 - y0 + 1;
  const o = new PNG({ width: nw, height: nh });
  for (let y = 0; y < nh; y += 1) {
    for (let x = 0; x < nw; x += 1) {
      const s = ((y0 + y) * w + (x0 + x)) * 4;
      const d = (y * nw + x) * 4;
      o.data[d] = data[s]; o.data[d + 1] = data[s + 1];
      o.data[d + 2] = data[s + 2]; o.data[d + 3] = data[s + 3];
    }
  }
  return o;
}

fs.mkdirSync(CIKTI, { recursive: true });
for (const [kaynak, hedef] of Object.entries(LISTE)) {
  const yol = path.join(KAYNAK, `${kaynak}.png`);
  if (!fs.existsSync(yol)) { console.log(`atlandı (yok): ${kaynak}`); continue; }
  const png = PNG.sync.read(fs.readFileSync(yol));
  const { atilan } = temizle(png);
  const son = kirp(png);
  fs.writeFileSync(path.join(CIKTI, `${hedef}.png`), PNG.sync.write(son));
  console.log(`${kaynak} → ${hedef}.png  ${son.width}x${son.height}  atılan ${atilan} piksel`);
}

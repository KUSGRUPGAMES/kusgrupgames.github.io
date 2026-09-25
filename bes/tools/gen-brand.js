/**
 * Platform ikonlarını **bitmiş master PNG'lerden** üretir.
 *
 *     node tools/gen-brand.js
 *
 * Kaynak yalnız iki dosyadır:
 *
 *     assets/brand/png/BES_AppIcon_Dark_1024.png
 *     assets/brand/png/BES_AppIcon_Light_1024.png
 *
 * **Logo burada çizilmez.** Vektör yolu üretilmez, yazı tipiyle "5" yazılmaz,
 * cami/minare/hilal kurulmaz, logo CSS ya da SVG ile yeniden yaratılmaz.
 * Daha önce depoda bulunan elle çizilmiş `assets/brand/svg/*.svg` dosyaları
 * onaylanan logonun yaklaşık rekonstrüksiyonlarıydı ve marka tasarımını
 * bozuyordu; kaldırıldılar (DECISIONS D17). Bu betiğin yaptığı iş üç şeyle
 * sınırlıdır ve üçü de logonun **geometrisine dokunmaz**:
 *
 * 1. **Kırpma.** Verilen master, logoyu kâğıt üzerinde sunan bir kompozisyon:
 *    kutucuğun çevresinde birkaç piksel açık zemin ve yumuşak bir gölge var.
 *    Launcher ikonu tam kare ve taşmalı olmak zorunda olduğu için kutucuğun
 *    kenarı ölçülüp dışındaki sunum çerçevesi atılır.
 * 2. **Ölçekleme.** Yalnız en-boy oranı korunarak. Hedef kare olduğunda kısa
 *    kenar doldurulur, uzun kenardan simetrik kırpılır (`cover`); hiçbir
 *    yönde esnetme yoktur.
 * 3. **Alfa ayıklama.** Şeffaf sembol, tek renk siluet ve Android uyarlanabilir
 *    ön planı masterın kendi piksellerinden parlaklık eşiğiyle ayrılır. Şekil
 *    masterın şeklidir; yeniden çizilmez.
 *
 * İki teknik uyarlama, ikisi de platformun zorunlu kıldığı şey:
 *
 * - **iOS ikonunda köşe yuvarlaması kaldırılır.** Master kutucuğu yuvarlak
 *   köşeli; Apple ikona kendi maskesini uyguluyor ve iki yuvarlama üst üste
 *   binince köşelerde açık renk bir hâle kalıyor (CLAUDE_HANDOFF kuralı 3).
 *   Köşe bölgesi kutucuğun kendi zemin rengiyle doldurulur — logoya dokunulmaz.
 * - **Android tek renk yüzeyleri** (bildirim küçük ikonu, Android 13 temalı
 *   ikon) işletim sisteminin zorunlu kıldığı tek istisnadır: oralarda renk
 *   taşınamaz, masterdan çıkarılan siluet kullanılır.
 */
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');
const { PNG } = require('pngjs');

const KOK = path.join(__dirname, '..');
const ASSETS = path.join(KOK, 'assets');
const MASTER = path.join(ASSETS, 'brand', 'png');

const TOKENS = JSON.parse(fs.readFileSync(path.join(ASSETS, 'brand', 'brand.tokens.json'), 'utf8'));

/** Android uyarlanabilir ikonun güvenli alanı: ortadaki %66'lık daire. */
const GUVENLI_ALAN = 0.66;

/**
 * Köşe yuvarlaması giderilirken kullanılan yarıçap (kenarın oranı olarak).
 *
 * Masterın kendi yuvarlaması ölçüldüğünde ≈0.21 çıkıyor; burada bilerek biraz
 * büyüğü alınıyor ki sunum çerçevesinden tek piksel bile kalmasın. Aradaki
 * fark köşe ucunda kalır ve iki platformun maskesi de (iOS ≈0.224 süperelips,
 * Android daire) orayı zaten kesiyor. Doldurma düz renkle değil, kutucuğun
 * kenarındaki gerçek piksellerin ışınsal uzatılmasıyla yapılır; düz yama
 * koyu ikonun köşesinde desensiz bir leke bırakıyordu.
 */
const KOSE = 0.28;

// ---------------------------------------------------------------- görüntü

const parlaklik = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function oku(ad) {
  const png = PNG.sync.read(fs.readFileSync(path.join(MASTER, ad)));
  return { w: png.width, h: png.height, d: png.data };
}

const pikselL = (im, x, y) => {
  const i = (y * im.w + x) * 4;
  return parlaklik(im.d[i], im.d[i + 1], im.d[i + 2]);
};

/** Boş RGBA tampon. */
const yeni = (boy) => ({ w: boy, h: boy, d: Buffer.alloc(boy * boy * 4) });

function yaz(ad, im, { saydam = true } = {}) {
  const png = new PNG({ width: im.w, height: im.h });
  im.d.copy(png.data);
  const hedef = path.join(ASSETS, ad);
  fs.mkdirSync(path.dirname(hedef), { recursive: true });
  fs.writeFileSync(hedef, PNG.sync.write(png, saydam ? {} : { colorType: 2 }));
  console.log(`${ad.padEnd(34)} ${im.w}×${im.h}${saydam ? '' : '  (alfasız)'}`);
}

// ------------------------------------------------------- kutucuğu ölçmek

/**
 * Bir tarama çizgisindeki en keskin parlaklık basamağının yerini döndürür.
 *
 * Kutucuk kenarı iki masterda da ters yönde: koyu masterda kâğıttan zemine
 * **düşüş**, açık masterda gölgeden zemine **yükseliş** var. Mutlak eğim
 * bakıldığı için tek ölçüt ikisinde de çalışır.
 */
function basamak(ornek) {
  const yumusak = ornek.map((_, i, a) => {
    const p = a[Math.max(0, i - 1)] ?? 0;
    const n = a[Math.min(a.length - 1, i + 1)] ?? 0;
    return (p + (a[i] ?? 0) + n) / 3;
  });
  const egimler = yumusak.map((v, i, a) => (i === 0 ? 0 : Math.abs(v - (a[i - 1] ?? 0))));
  const enBuyuk = Math.max(...egimler);
  const tepe = egimler.indexOf(enBuyuk);
  // Kenarda çoğu zaman iki basamak yan yanadır: kâğıt→gölge ve gölge→kutucuk.
  // Aranan **içteki** olandır; dıştaki seçilirse sunum çerçevesinden birkaç
  // piksel ikona sızar. Tepeden en çok 12 piksel içeriye bakılır — daha
  // geniş bir pencere açık masterda gürültüyü basamak sanıp ölçümü 57 piksel
  // içeri kaydırmıştı.
  let enIyi = tepe;
  for (let i = tepe; i < Math.min(egimler.length, tepe + 12); i += 1) {
    if ((egimler[i] ?? 0) >= enBuyuk * 0.5) enIyi = i;
  }
  return enIyi;
}

/** Sunum çerçevesinin içindeki kutucuğun sınırları. */
function kutucuk(im) {
  // Sunum çerçevesi her iki masterda da 40 pikselden ince. Arama bandı dar
  // tutulmazsa tarama çizgisi logonun kendi kenarına çarpıyor: açık masterda
  // "5"in alt kenarı kutucuk kenarından daha keskin bir basamak ve ölçüm
  // 112 piksel içeri kayıyordu.
  const ARAMA = 70;
  const mx = im.w >> 1;
  const my = im.h >> 1;
  const dizi = (n, f) => Array.from({ length: n }, (_, i) => f(i));

  const x0 = basamak(dizi(ARAMA, (i) => pikselL(im, i, my)));
  const x1 = im.w - 1 - basamak(dizi(ARAMA, (i) => pikselL(im, im.w - 1 - i, my)));
  const y0 = basamak(dizi(ARAMA, (i) => pikselL(im, mx, i)));
  const y1 = im.h - 1 - basamak(dizi(ARAMA, (i) => pikselL(im, mx, im.h - 1 - i)));

  return { x0, y0, x1, y1 };
}

// ---------------------------------------------------------- yeniden örnekleme

/**
 * Kaynağın `(sx, sy, sw, sh)` dikdörtgenini `boy × boy` hedefe oturtur.
 *
 * Küçültmede alan ortalaması alınır (kutu süzgeci); büyütmede çift doğrusal.
 * Alfa çarpılmış olarak toplanır, yoksa saydam kenarlarda koyu bir hat kalır.
 * En-boy oranı çağıran tarafından korunur: buraya her zaman hedefle aynı
 * oranda bir dikdörtgen gelir.
 */
function olcekle(im, sx, sy, sw, sh, boy) {
  const out = yeni(boy);
  const olcek = sw / boy;
  for (let dy = 0; dy < boy; dy += 1) {
    for (let dx = 0; dx < boy; dx += 1) {
      const x0 = sx + dx * olcek;
      const y0 = sy + dy * (sh / boy);
      const x1 = x0 + olcek;
      const y1 = y0 + sh / boy;
      let r = 0; let g = 0; let b = 0; let a = 0; let n = 0;
      const ix0 = Math.floor(x0); const ix1 = Math.max(ix0 + 1, Math.ceil(x1));
      const iy0 = Math.floor(y0); const iy1 = Math.max(iy0 + 1, Math.ceil(y1));
      for (let y = iy0; y < iy1; y += 1) {
        for (let x = ix0; x < ix1; x += 1) {
          const cx = Math.min(im.w - 1, Math.max(0, x));
          const cy = Math.min(im.h - 1, Math.max(0, y));
          const i = (cy * im.w + cx) * 4;
          const al = (im.d[i + 3] ?? 0) / 255;
          r += (im.d[i] ?? 0) * al; g += (im.d[i + 1] ?? 0) * al; b += (im.d[i + 2] ?? 0) * al;
          a += al; n += 1;
        }
      }
      const j = (dy * boy + dx) * 4;
      if (a > 0) {
        out.d[j] = Math.round(r / a);
        out.d[j + 1] = Math.round(g / a);
        out.d[j + 2] = Math.round(b / a);
      }
      out.d[j + 3] = Math.round((a / n) * 255);
    }
  }
  return out;
}

// -------------------------------------------------------------- ikon kutucuğu

/**
 * Master kutucuğunu tam kare, taşmalı ve köşeleri düzleştirilmiş olarak verir.
 * Kısa kenar doldurulur, uzun kenardan simetrik kırpılır — esnetme yok.
 */
function ikonKutucugu(im, kutuHam, boy) {
  // Kenardan 6 piksel içeri: kutucuğun parlak kenar hattı ikonun düz
  // kenarlarında ince bir çizgi olarak kalıyordu. Kırpma dört yandan eşit,
  // ölçek tekdüze — oran ve geometri değişmez.
  const I = 6;
  const kutu = { x0: kutuHam.x0 + I, y0: kutuHam.y0 + I, x1: kutuHam.x1 - I, y1: kutuHam.y1 - I };
  const kw = kutu.x1 - kutu.x0 + 1;
  const kh = kutu.y1 - kutu.y0 + 1;
  const kenar = Math.min(kw, kh);
  const sx = kutu.x0 + (kw - kenar) / 2;
  const sy = kutu.y0 + (kh - kenar) / 2;
  const out = olcekle(im, sx, sy, kenar, kenar, boy);

  // Köşeleri düzle: yayın dışındaki her piksel, yayın **içindeki aynası**
  // ile doldurulur (yaydan d−r kadar dışarıdaki piksel, r−(d−r) kadar
  // içerideki pikselin kopyası). Eskiden yay üzerindeki tek piksel ışınsal
  // uzatılıyordu; desenli zeminde köşelerde ışın gibi çizgiler bırakıyordu.
  // Ayna, desenin dokusunu korur. Logoya dokunulmaz — logo köşelere girmiyor.
  const r = KOSE * boy;
  const kaynak = Buffer.from(out.d);
  const ornek = (fx, fy) => {
    const x = Math.min(boy - 1, Math.max(0, Math.round(fx)));
    const y = Math.min(boy - 1, Math.max(0, Math.round(fy)));
    return (y * boy + x) * 4;
  };
  for (const [ox, oy] of [[0, 0], [1, 0], [0, 1], [1, 1]]) {
    const mx = ox ? boy - r : r;
    const my = oy ? boy - r : r;
    for (let y = 0; y < Math.ceil(r); y += 1) {
      for (let x = 0; x < Math.ceil(r); x += 1) {
        const px = ox ? boy - 1 - x : x;
        const py = oy ? boy - 1 - y : y;
        const vx = px + 0.5 - mx;
        const vy = py + 0.5 - my;
        const d = Math.hypot(vx, vy);
        if (d <= r) continue;
        const ic = Math.max(r * 0.5, 2 * r - d - 1);
        const k = ornek(mx + (vx * ic) / d, my + (vy * ic) / d);
        const i = (py * boy + px) * 4;
        out.d[i] = kaynak[k] ?? 0;
        out.d[i + 1] = kaynak[k + 1] ?? 0;
        out.d[i + 2] = kaynak[k + 2] ?? 0;
      }
    }
  }
  for (let i = 3; i < out.d.length; i += 4) out.d[i] = 255;
  return out;
}

// ------------------------------------------------------------ sembol ayıklama

/**
 * Masterın kendi piksellerinden logoyu ayırır: koyu masterda altın figür açık,
 * zemin koyu; açık masterda tersi. Eşik yumuşak tutulur, kenar tırtıklı
 * kalmasın. Şekil masterın şeklidir — burada hiçbir şey yeniden çizilmez.
 */
/** Piksel kutucuğun yuvarlatılmış köşesinin dışında mı? */
function kosedeDisarida(kutu, x, y, pay = 0) {
  const kenar = Math.min(kutu.x1 - kutu.x0 + 1, kutu.y1 - kutu.y0 + 1);
  const r = KOSE * kenar;
  const mx = x < kutu.x0 + r ? kutu.x0 + r : (x > kutu.x1 - r ? kutu.x1 - r : x);
  const my = y < kutu.y0 + r ? kutu.y0 + r : (y > kutu.y1 - r ? kutu.y1 - r : y);
  return Math.hypot(x - mx, y - my) > r - pay;
}

function alfaMaskesi(im, koyuZemin, kutu) {
  const out = { w: im.w, h: im.h, d: Buffer.alloc(im.w * im.h * 4) };
  const [lo, hi] = koyuZemin ? [70, 140] : [170, 90];
  for (let y = 0; y < im.h; y += 1) {
    for (let x = 0; x < im.w; x += 1) {
      const i = (y * im.w + x) * 4;
      out.d[i] = im.d[i]; out.d[i + 1] = im.d[i + 1]; out.d[i + 2] = im.d[i + 2];
      // Kutucuğun dışı sunum çerçevesidir: koyu masterda kâğıt açık renkli
      // olduğu için eşiği geçiyor ve sembol yerine kartın tamamı çıkıyordu.
      // Kenardan 10 piksel de içeri girilir: kutucuk sınırındaki geçiş
      // pikselleri eşiğin ortasına düşüyor ve şeffaf sembolün çevresinde
      // hayalet bir yuvarlak dikdörtgen çizgisi bırakıyordu. Logo kenara
      // 100 pikselden fazla uzakta, bu pay ona değmiyor.
      // 2026 masterında kutucuğun kenarında ince parlak bir hat var; 10
      // piksel yetmedi, Android ikonunun köşelerinde silik yaylar kaldı.
      const PAY = 24;
      if (x < kutu.x0 + PAY || x > kutu.x1 - PAY || y < kutu.y0 + PAY || y > kutu.y1 - PAY) continue;
      // Kutucuğun köşeleri yuvarlak: dikdörtgen maske köşelerde kâğıdı
      // içeride bırakıyor ve koyu masterda dört köşede beyaz lekeler
      // çıkıyordu. Yay da maskeye dâhil edilir.
      if (kosedeDisarida(kutu, x, y, PAY)) continue;
      const L = parlaklik(im.d[i], im.d[i + 1], im.d[i + 2]);
      const t = Math.min(1, Math.max(0, (L - lo) / (hi - lo)));
      out.d[i + 3] = Math.round(t * 255);
    }
  }
  return out;
}

/** Alfası olan görüntünün dolu bölgesinin sınırları. */
function figurKutusu(im, kutu) {
  let x0 = im.w; let y0 = im.h; let x1 = 0; let y1 = 0;
  for (let y = kutu.y0; y <= kutu.y1; y += 1) {
    for (let x = kutu.x0; x <= kutu.x1; x += 1) {
      if ((im.d[(y * im.w + x) * 4 + 3] ?? 0) < 128) continue;
      if (x < x0) x0 = x; if (x > x1) x1 = x;
      if (y < y0) y0 = y; if (y > y1) y1 = y;
    }
  }
  return { x0, y0, x1, y1 };
}

/**
 * Güvenli daireye sığan doluluk oranı.
 *
 * Android uyarlanabilir ikonu yuvarlak maskeyle de gösterilebilir ve yalnız
 * ortadaki %66'lık **daire** garanti altındadır. Figürün sınırlayıcı
 * dikdörtgenini %66'ya oturtmak yetmiyor: "5"in üst kanadı ile alt kâsesi
 * köşelere doğru uzandığı için pikselin %1,5'i dairenin dışında kalıyordu.
 * Burada ölçü figürün merkezden **en uzak opak pikseli** alınır; sonuç
 * ≈%56'lık bir dikdörtgen doluluk, yani görünen dairenin %85'i kadar bir
 * logo — dairenin içinde, gözle de küçük durmayan oran.
 */
function guvenliDoluluk(im, fig) {
  const cx = (fig.x0 + fig.x1 + 1) / 2;
  const cy = (fig.y0 + fig.y1 + 1) / 2;
  let enUzak = 1;
  for (let y = fig.y0; y <= fig.y1; y += 1) {
    for (let x = fig.x0; x <= fig.x1; x += 1) {
      if ((im.d[(y * im.w + x) * 4 + 3] ?? 0) < 128) continue;
      const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
      if (d > enUzak) enUzak = d;
    }
  }
  const uzun = Math.max(fig.x1 - fig.x0 + 1, fig.y1 - fig.y0 + 1);
  return (GUVENLI_ALAN * uzun) / (2 * enUzak);
}

/**
 * Figürü kare tuvalin ortasına, uzun kenarı `doluluk` oranını kaplayacak
 * biçimde yerleştirir. En-boy oranı korunur.
 */
function ortala(im, fig, boy, doluluk) {
  const fw = fig.x1 - fig.x0 + 1;
  const fh = fig.y1 - fig.y0 + 1;
  const kenar = Math.max(fw, fh) / doluluk;
  const sx = (fig.x0 + fig.x1 + 1) / 2 - kenar / 2;
  const sy = (fig.y0 + fig.y1 + 1) / 2 - kenar / 2;
  return olcekle(im, sx, sy, kenar, kenar, boy);
}

/** Alfayı koruyup rengi sabitler (tek renk siluet). */
function boya(im, [r, g, b]) {
  for (let i = 0; i < im.d.length; i += 4) {
    im.d[i] = r; im.d[i + 1] = g; im.d[i + 2] = b;
  }
  return im;
}

/** Saydam figürün arkasına düz zemin koyar (alfasız çıktılar için). */
function zeminle(im, [r, g, b]) {
  for (let i = 0; i < im.d.length; i += 4) {
    const a = (im.d[i + 3] ?? 0) / 255;
    im.d[i] = Math.round((im.d[i] ?? 0) * a + r * (1 - a));
    im.d[i + 1] = Math.round((im.d[i + 1] ?? 0) * a + g * (1 - a));
    im.d[i + 2] = Math.round((im.d[i + 2] ?? 0) * a + b * (1 - a));
    im.d[i + 3] = 255;
  }
  return im;
}

const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16));

// ------------------------------------------------------------------- üretim

const koyu = oku('BES_AppIcon_Dark_1024.png');
const acik = oku('BES_AppIcon_Light_1024.png');
const koyuKutu = kutucuk(koyu);
const acikKutu = kutucuk(acik);

const koyuSembol = alfaMaskesi(koyu, true, koyuKutu);
const acikSembol = alfaMaskesi(acik, false, acikKutu);
const koyuFigur = figurKutusu(koyuSembol, koyuKutu);
const acikFigur = figurKutusu(acikSembol, acikKutu);

const ZEMIN = hex(TOKENS.colors.deepEmerald);

console.log(`koyu master kutucuk  x${koyuKutu.x0}–${koyuKutu.x1} y${koyuKutu.y0}–${koyuKutu.y1}`);
console.log(`açık master kutucuk  x${acikKutu.x0}–${acikKutu.x1} y${acikKutu.y0}–${acikKutu.y1}`);
console.log('');

// --- iOS ve mağaza ikonu: masterın kendisi, tam kare, alfasız.
yaz('icon.png', ikonKutucugu(koyu, koyuKutu, 1024), { saydam: false });
yaz('brand/app-icon-ios-light.png', ikonKutucugu(acik, acikKutu, 1024), { saydam: false });
// Büyük marka kullanımı (mağaza, tanıtım, uygulama içi): aynı kutucuk, 512.
yaz('brand/logo-dark.png', ikonKutucugu(koyu, koyuKutu, 512), { saydam: false });
yaz('brand/logo-light.png', ikonKutucugu(acik, acikKutu, 512), { saydam: false });

// --- Android uyarlanabilir ikon: sembol güvenli alana, zemin app.config'ten.
// Kutucuğun kendisi konmaz; daire maske içinde ikinci bir kart görünürdü.
const ANDROID = guvenliDoluluk(koyuSembol, koyuFigur);
yaz('adaptive-icon.png', ortala(koyuSembol, koyuFigur, 1024, ANDROID));
// Android 13+ temalı ikon: sistem yalnız alfayı okur.
yaz('adaptive-icon-mono.png', boya(ortala(koyuSembol, koyuFigur, 1024, ANDROID), [255, 255, 255]));
// Bildirim küçük ikonu: durum çubuğunda sistem rengiyle boyanır.
yaz('brand/notification-icon.png', boya(ortala(koyuSembol, koyuFigur, 512, 0.78), [255, 255, 255]));

// --- Açılış ekranı: saydam sembol, zemin rengi app.config.ts'ten gelir.
yaz('splash-icon.png', ortala(koyuSembol, koyuFigur, 1024, 0.9));
yaz('brand/splash-icon-light.png', ortala(acikSembol, acikFigur, 1024, 0.9));

// --- Küçük yüzeyler (Watch complication, Dynamic Island, liste rozeti):
// CLAUDE_HANDOFF kuralı 10 — oralarda tek renk siluet.
yaz('brand/symbol-micro-light.png', boya(ortala(koyuSembol, koyuFigur, 256, 0.92), [255, 255, 255]));
yaz('brand/symbol-micro-dark.png', boya(ortala(acikSembol, acikFigur, 256, 0.92), [0, 0, 0]));

// --- Web
yaz('favicon.png', zeminle(ortala(koyuSembol, koyuFigur, 96, 0.82), ZEMIN), { saydam: false });

console.log(`\nKaynak: assets/brand/png/ — ${TOKENS.brandName} master ikonları, olduğu gibi.`);

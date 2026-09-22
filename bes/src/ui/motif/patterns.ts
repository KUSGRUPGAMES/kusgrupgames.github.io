/**
 * Geometrik motif dili — şartname §9.
 *
 * Kural: motifler **soyut geometridir**. Hiçbir canlı figür, hiçbir insan
 * yüzü, hiçbir Kâbe/cami fotoğrafı kullanılmaz; İslam sanatının kendi dili
 * olan çokgen örgü (girih), sekiz köşeli yıldız (rub'ül hizb), sekizgen
 * döşeme ve mihrap kemeri ile sınırlıdır. Hepsi düşük opaklıkta arka planda
 * kalır; okunabilirliği asla düşürmez.
 *
 * ## Bu dosya bir kez baştan yazıldı — sebebi önemli
 *
 * İlk sürümde `rubElHizb` karosu **altı köşeli** bir yıldız çiziyordu: köşe
 * listesinde 12 nokta vardı, yani 6 dış uç. Bir namaz uygulamasının arka
 * planında tekrar eden altı köşeli yıldız Davud yıldızı olarak okunur.
 * Sınama da yanlıştı — koordinatları ezberleyip hatayı kilitlemişti. Artık
 * sınama **geometriyi** denetliyor: sekiz uç sayılıyor.
 *
 * İkinci sorun biçimseldi. Desenler "kareye damgalanmış tek tek şekiller"di;
 * İslam bezemesi böyle çalışmaz — süreklidir, örgüdür, karo sınırında kesilip
 * komşu karoda devam eder. Karolar artık **kenar eşlemeli** kuruluyor: motif
 * karenin merkezine ve dört köşesine birden yerleştiriliyor, böylece
 * `<pattern>` karoyu kırptığında komşu karo eksik parçayı tamamlıyor.
 * Koordinatların karo dışına taşması bu yüzden **doğrudur**, hata değil.
 *
 * Her desen tek bir karo üretir; karo SVG `<Pattern>` ile döşenir.
 */

export type MotifName = 'rubElHizb' | 'girih' | 'octagonGrid' | 'arch' | 'starLattice' | 'plain';

export interface MotifTile {
  /** Karo kenarı (SVG kullanıcı birimi). */
  size: number;
  /** Karoyu oluşturan yollar. */
  paths: string[];
  /** İçi dolu mu, yoksa yalnız kontur mu çizilir. */
  fill: boolean;
  strokeWidth: number;
}

const n = (v: number) => v.toFixed(2);
const kapali = (pts: [number, number][]) => `M${pts.map(([x, y]) => `${n(x)},${n(y)}`).join('L')}Z`;

/**
 * Sekiz köşeli yıldız — rub'ül hizb işaretinin geometrisi: **üst üste binmiş
 * iki kare**, biri 45° döndürülmüş. Sekiz ucun hepsi merkezden eşit uzaklıkta.
 *
 * İki kare olarak çizilir, tek bir zikzak çokgen olarak değil: örgü etkisi
 * kenarların birbirini kesmesinden doğar, İslam bezemesini bezeme yapan da
 * budur. Tek çokgen çizmek yıldızı bir "damga"ya çevirir.
 */
function yildizYollari(cx: number, cy: number, r: number): string[] {
  const a = r / Math.SQRT2;                     // eksenel karenin yarı kenarı
  const kare: [number, number][] = [[cx - a, cy - a], [cx + a, cy - a], [cx + a, cy + a], [cx - a, cy + a]];
  const elmas: [number, number][] = [[cx, cy - r], [cx + r, cy], [cx, cy + r], [cx - r, cy]];
  return [kapali(kare), kapali(elmas)];
}

/** Düzgün çokgen; daire yerine kullanılır (yay komutu `A` bilerek yok). */
function cokgen(cx: number, cy: number, r: number, kenar: number, faz = 0): string {
  const pts: [number, number][] = Array.from({ length: kenar }, (_, i) => {
    const t = faz + (2 * Math.PI * i) / kenar;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  return kapali(pts);
}

/** Motifi karonun merkezine ve dört köşesine koyar — kenar eşlemeli döşeme. */
function orgu(size: number, ciz: (cx: number, cy: number) => string[]): string[] {
  const merkezler: [number, number][] = [
    [size / 2, size / 2], [0, 0], [size, 0], [0, size], [size, size],
  ];
  return merkezler.flatMap(([x, y]) => ciz(x, y));
}

/**
 * Rub'ül hizb — Kur'an'da hizb bölümlerini gösteren ۞ işaretinin geometrisi.
 *
 * Bu **logo değildir**: sekiz köşeli yıldız ve daire İslam sanatının ortak
 * dilinden gelir, markaya ait bir işaret taşımaz. Logo hiçbir koşulda kodla
 * çizilmez (DECISIONS D17); burada yalnız yüzey dokusu üretilir.
 */
function rubElHizb(size: number): MotifTile {
  const r = size * 0.34;
  return {
    size,
    paths: orgu(size, (cx, cy) => [...yildizYollari(cx, cy, r), cokgen(cx, cy, r * 0.34, 24)]),
    fill: false,
    strokeWidth: Math.max(0.6, size * 0.014),
  };
}

/**
 * Girih örgüsü — sekizgen/kare döşemesinin (4.8.8) üstüne oturan sekiz köşeli
 * yıldız. Sekizgen komşularıyla kenar paylaşır, köşelerde kalan boşluğu 45°
 * döndürülmüş kare doldurur: düzlemde boşluk kalmaz, örgü sürer.
 */
function girih(size: number): MotifTile {
  const t = size / (1 + Math.SQRT2);            // sekizgenin kenarı
  const R = t / (2 * Math.sin(Math.PI / 8));    // çevrel yarıçap
  const kareR = t / Math.SQRT2;                 // köşe karesinin çevrel yarıçapı
  const c = size / 2;
  const kose: [number, number][] = [[0, 0], [size, 0], [0, size], [size, size]];
  return {
    size,
    paths: [
      cokgen(c, c, R, 8, Math.PI / 8),
      ...yildizYollari(c, c, R * 0.72),
      ...kose.map(([x, y]) => cokgen(x, y, kareR, 4, Math.PI / 4)),
    ],
    fill: false,
    strokeWidth: Math.max(0.6, size * 0.012),
  };
}

/**
 * Sekizgen döşeme — kesik kare döşemesi (4.8.8), geniş yüzeylerde sakin doku.
 * Yıldız yok; yalnız sekizgen ve köşe karesi. Zeminin kendisi okunurluğu
 * bozmadan dolu görünsün diye.
 */
function octagonGrid(size: number): MotifTile {
  const t = size / (1 + Math.SQRT2);
  const R = t / (2 * Math.sin(Math.PI / 8));
  const kareR = t / Math.SQRT2;
  const kose: [number, number][] = [[0, 0], [size, 0], [0, size], [size, size]];
  return {
    size,
    paths: [
      cokgen(size / 2, size / 2, R, 8, Math.PI / 8),
      ...kose.map(([x, y]) => cokgen(x, y, kareR, 4, Math.PI / 4)),
    ],
    fill: false,
    strokeWidth: Math.max(0.6, size * 0.012),
  };
}

/**
 * Mihrap/revak hattı — sivri kemer dizisi.
 *
 * Kemerler **sürekli bir impost hattından** doğar ve karo kenarında yarım
 * sütunla kesilir; komşu karo öbür yarısını getirir, revak kesintisiz akar.
 * Önceki sürümde kemerler havada duruyor, aralarında boşluk kalıyordu.
 */
function arch(size: number): MotifTile {
  const s = size;
  const taban = s * 0.94;                       // impost hattı
  const tepe = s * 0.10;                        // kemerin tepesi
  const omuz = s * 0.55;                        // kemerin doğduğu yükseklik
  // **Kemer sivridir, yuvarlak değil.** Bir kez yuvarlak çıktı: denetim
  // noktası tepeyle aynı yükseklikteydi (`Q0,tepe → s/2,tepe`), bu da tepede
  // teğeti yatay bırakıp kemeri yarım daireye çeviriyordu. Denetim noktası
  // tepenin **altına** indirilince iki yarım tepede sivri uçla birleşiyor.
  const denetim = tepe + (omuz - tepe) * 0.42;
  const yariSutun = (x: number) => `M${n(x)},${n(taban)}L${n(x)},${n(omuz)}`;
  const kemer = `M0.00,${n(omuz)}Q0.00,${n(denetim)} ${n(s / 2)},${n(tepe)}`
    + `Q${n(s)},${n(denetim)} ${n(s)},${n(omuz)}`;
  return {
    size,
    paths: [
      `M0.00,${n(taban)}L${n(s)},${n(taban)}`,  // sürekli taban hattı
      kemer,
      yariSutun(0), yariSutun(s),
    ],
    fill: false,
    strokeWidth: Math.max(0.6, size * 0.014),
  };
}

/**
 * Yıldız kafesi — khatam: sekiz köşeli yıldızlar hem karo merkezinde hem dört
 * köşesinde, uçları birbirine değecek sıklıkta. Kart başlıklarında kullanılır.
 * Daire yok, yalnız örgü; rub'ül hizb'den farkı budur.
 */
function starLattice(size: number): MotifTile {
  const r = size * 0.35;
  return {
    size,
    paths: orgu(size, (cx, cy) => yildizYollari(cx, cy, r)),
    fill: false,
    strokeWidth: Math.max(0.6, size * 0.012),
  };
}

const BUILDERS: Record<Exclude<MotifName, 'plain'>, (size: number) => MotifTile> = {
  rubElHizb,
  girih,
  octagonGrid,
  arch,
  starLattice,
};

/** İstenen deseni verilen karo boyutunda üretir. `plain` boş karo döner. */
export function motifTile(name: MotifName, size = 48): MotifTile {
  if (name === 'plain') return { size, paths: [], fill: false, strokeWidth: 0 };
  const build = BUILDERS[name];
  return build(size);
}

export const MOTIF_NAMES: readonly MotifName[] = ['rubElHizb', 'girih', 'octagonGrid', 'arch', 'starLattice', 'plain'];

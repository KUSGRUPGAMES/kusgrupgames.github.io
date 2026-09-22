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
 * Sekiz köşeli yıldız — girih örgüsünün düğüm noktası.
 * `oran` iç/dış yarıçap; 0.42 markanın ikonundaki sivrilikle aynı.
 */
function yildiz(cx: number, cy: number, R: number, oran = 0.42): string {
  const r = R * oran;
  const pts: [number, number][] = Array.from({ length: 16 }, (_, i) => {
    const a = (Math.PI / 8) * i + Math.PI / 8;
    const rad = i % 2 === 0 ? R : r;
    return [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];
  });
  return kapali(pts);
}

/** Düzgün çokgen (yay komutu `A` bilerek yok). */
function cokgen(cx: number, cy: number, r: number, kenar: number, faz = 0): string {
  const pts: [number, number][] = Array.from({ length: kenar }, (_, i) => {
    const t = faz + (2 * Math.PI * i) / kenar;
    return [cx + r * Math.cos(t), cy + r * Math.sin(t)];
  });
  return kapali(pts);
}

/** Karonun merkezi ve dört köşesi — kenar eşlemeli döşemenin kalbi. */
const MERKEZLER = (s: number): [number, number][] => [
  [s / 2, s / 2], [0, 0], [s, 0], [0, s], [s, s],
];

/**
 * Girih şerit örgüsü — markanın kendi deseni.
 *
 * Kaynak uydurma değil: uygulama ikonunun (`assets/brand/png/BES_AppIcon_*`)
 * arka planında duran desen büyütülüp okunarak kuruldu. Marka panosu bunu
 * "İslami Geometrik Desen" başlığıyla ayrı bir öge olarak tanımlıyor ve
 * %4–8 opaklık öneriyor.
 *
 * **İnce çizgi, dolu siluet değil.** Bir kez dolu siluet denendi ve desen
 * "kareli defter" gibi okundu; İslam bezemesi şerittir, yüzeyi boyamaz.
 *
 * Yıldızlar karonun merkezine ve dört köşesine konur, çapraz şeritlerle
 * birbirine bağlanır, kenar ortalarında küçük baklava gözler kalır.
 */
function girihOrgu(size: number): MotifTile {
  const R = size * 0.20;
  const yollar: string[] = [];
  const M = MERKEZLER(size);
  M.forEach(([cx, cy]) => yollar.push(yildiz(cx, cy, R)));
  M.forEach(([cx, cy]) => {
    for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]] as [number, number][]) {
      const a = Math.atan2(dy, dx);
      const t = R / Math.hypot(size / 2, size / 2);
      yollar.push(`M${n(cx + R * Math.cos(a))},${n(cy + R * Math.sin(a))}`
        + `L${n(cx + (dx * size) / 2 * (1 - t))},${n(cy + (dy * size) / 2 * (1 - t))}`);
    }
  });
  for (const [cx, cy] of [[size / 2, 0], [0, size / 2], [size, size / 2], [size / 2, size]] as [number, number][]) {
    const g = size * 0.055;
    yollar.push(kapali([[cx - g, cy], [cx, cy - g], [cx + g, cy], [cx, cy + g]]));
  }
  return { size, paths: yollar, fill: false, strokeWidth: Math.max(0.7, size * 0.013) };
}

/** Rub'ül hizb — girih örgüsünün kendisi; uygulamanın ana dokusu. */
function rubElHizb(size: number): MotifTile {
  return girihOrgu(size);
}

/** Yıldız kafesi — aynı örgü, şeritsiz: yalnız yıldızlar, daha sakin. */
function starLattice(size: number): MotifTile {
  const R = size * 0.22;
  return {
    size,
    paths: MERKEZLER(size).map(([cx, cy]) => yildiz(cx, cy, R)),
    fill: false,
    strokeWidth: Math.max(0.7, size * 0.012),
  };
}

/** Girih — tam örgü, kart ve ekran zeminlerinde. */
function girih(size: number): MotifTile {
  return girihOrgu(size);
}

/**
 * Sekizgen döşeme — kesik kare döşemesi (4.8.8): düzgün sekizgen komşusuyla
 * kenar paylaşır, köşede 45° dönmüş kare kalır. Okumanın önüne geçmemesi
 * gereken uzun metin ekranlarında kullanılır.
 */
function octagonGrid(size: number): MotifTile {
  const t = size / (1 + Math.SQRT2);
  const R = t / (2 * Math.sin(Math.PI / 8));
  const kareR = t / Math.SQRT2;
  const kose: [number, number][] = [[0, 0], [size, 0], [0, size], [size, size]];
  return {
    size,
    paths: [
      cokgen(size / 2, size / 2, R * 0.92, 8, Math.PI / 8),
      ...kose.map(([x, y]) => cokgen(x, y, kareR * 0.92, 4, Math.PI / 4)),
    ],
    fill: false,
    strokeWidth: Math.max(0.7, size * 0.012),
  };
}

/**
 * Mihrap/revak hattı — sivri kemer dizisi.
 *
 * **Kemer sivridir, yuvarlak değil.** Bir kez yuvarlak çıktı: denetim noktası
 * tepeyle aynı yükseklikteydi, teğet tepede yatay kalıp kemeri yarım daireye
 * çeviriyordu. Denetim noktası tepenin altına indirilince iki yarım tepede
 * sivri uçla birleşiyor.
 */
function arch(size: number): MotifTile {
  const s = size;
  const taban = s * 0.94;
  const tepe = s * 0.12;
  const omuz = s * 0.56;
  const denetim = tepe + (omuz - tepe) * 0.42;
  return {
    size,
    paths: [
      `M0.00,${n(taban)}L0.00,${n(omuz)}`
        + `Q0.00,${n(denetim)} ${n(s / 2)},${n(tepe)}`
        + `Q${n(s)},${n(denetim)} ${n(s)},${n(omuz)}`
        + `L${n(s)},${n(taban)}`,
      `M0.00,${n(taban)}L${n(s)},${n(taban)}`,
    ],
    fill: false,
    strokeWidth: Math.max(0.7, size * 0.016),
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

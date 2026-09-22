import { motifTile, MOTIF_NAMES, type MotifName } from '@/ui/motif/patterns';

/**
 * Motif sınamaları — geometriyi denetler, koordinat ezberlemez.
 *
 * Önceki sürüm tam tersini yapıyordu: `rubElHizb` karosunun ilk köşesinin
 * birebir `M48.00 4.00` olmasını bekliyordu. O koordinatlar **altı köşeli**
 * bir yıldız çiziyordu ve sınama hatayı kilitlemişti. Bir namaz uygulamasının
 * arka planında tekrar eden altı köşeli yıldız Davud yıldızı olarak okunur.
 * Artık uç sayılıyor.
 */

type Nokta = [number, number];

/** Yolu düğüm noktalarına ayırır (M/L/Q/Z; göreli komut yok). */
function noktalar(d: string): Nokta[] {
  const sayilar = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
  const cift: Nokta[] = [];
  for (let i = 0; i + 1 < sayilar.length; i += 2) {
    cift.push([sayilar[i] ?? 0, sayilar[i + 1] ?? 0]);
  }
  return cift;
}

/** Nokta kümesinin ağırlık merkezi. */
function merkez(pts: Nokta[]): Nokta {
  const n = Math.max(1, pts.length);
  return [pts.reduce((a, q) => a + q[0], 0) / n, pts.reduce((a, q) => a + q[1], 0) / n];
}

/** Bir kapalı çokgenin merkezden uzaklık dizisindeki yerel en büyükleri sayar. */
function ucSayisi(pts: Nokta[]): number {
  const [cx, cy] = merkez(pts);
  const r = pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
  const al = (i: number) => r[((i % r.length) + r.length) % r.length] ?? 0;
  let uc = 0;
  for (let i = 0; i < r.length; i += 1) {
    if (al(i) > al(i - 1) + 1e-6 && al(i) > al(i + 1) + 1e-6) uc += 1;
  }
  return uc;
}

describe('geometrik motifler', () => {
  it('plain dışında her desen en az bir yol üretir', () => {
    for (const name of MOTIF_NAMES) {
      const t = motifTile(name, 48);
      if (name === 'plain') expect(t.paths).toHaveLength(0);
      else expect(t.paths.length).toBeGreaterThan(0);
    }
  });

  it('yollar yalnız sayı, harf ve ayraç içerir — NaN üretmez', () => {
    for (const name of MOTIF_NAMES) {
      for (const d of motifTile(name, 64).paths) {
        expect(d).not.toMatch(/NaN|Infinity|undefined/);
        expect(d).toMatch(/^[-MLQZ0-9., ]+$/i);
      }
    }
  });

  it('karo boyutu istenen değerdir; taşma karo kenarının bir katını aşmaz', () => {
    // Kenar eşlemeli döşemede motif karonun köşelerine de konur, bu yüzden
    // koordinatlar karo dışına **taşar** — `<pattern>` kırpar, eksik parçayı
    // komşu karo getirir. Taşmayı yasaklamak deseni damgaya çevirir; sınırsız
    // bırakmak da hesap hatasını gizler. Bir karo kadar tolerans doğru yer.
    const size = 40;
    for (const name of MOTIF_NAMES) {
      const t = motifTile(name, size);
      expect(t.size).toBe(size);
      for (const d of t.paths) {
        for (const v of (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number)) {
          expect(v).toBeGreaterThanOrEqual(-size);
          expect(v).toBeLessThanOrEqual(size * 2);
        }
      }
    }
  });

  it('rub’ül hizb yıldızı SEKİZ köşelidir — altı değil', () => {
    // İki kare üst üste: eksenel kare + 45° döndürülmüşü. Sekiz köşenin
    // **hepsi** ortak merkezden aynı uzaklıkta ve komşu köşeler arası açı tam
    // 45° olmalı. Altı köşeli bir yıldızda bu açı 60° çıkar, sınama yanar.
    const t = motifTile('rubElHizb', 96);
    const kareler = t.paths.filter((d) => noktalar(d).length === 4).slice(0, 2);
    expect(kareler).toHaveLength(2);

    const koseler = kareler.flatMap(noktalar);
    expect(koseler).toHaveLength(8);
    const [cx, cy] = merkez(koseler);

    const yaricaplar = koseler.map(([x, y]) => Math.hypot(x - cx, y - cy));
    for (const r of yaricaplar) expect(r).toBeCloseTo(yaricaplar[0] ?? 0, 1);

    const acilar = koseler
      .map(([x, y]) => ((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 360) % 360)
      .sort((a, b) => a - b);
    for (let i = 0; i < acilar.length; i += 1) {
      const su = acilar[i] ?? 0;
      const sonraki = acilar[(i + 1) % acilar.length] ?? 0;
      expect((sonraki - su + 360) % 360).toBeCloseTo(45, 1);
    }
  });


  it('hiçbir motif altı köşeli yıldız üretmez', () => {
    // Genel kural: kapalı hiçbir çokgen tam altı uç vermemeli.
    for (const name of MOTIF_NAMES) {
      for (const d of motifTile(name, 96).paths) {
        if (!d.endsWith('Z')) continue;
        const pts = noktalar(d);
        if (pts.length < 6) continue;
        expect(ucSayisi(pts)).not.toBe(6);
      }
    }
  });

  it('örgü desenleri kenar eşlemelidir — karo sınırında kesilmez', () => {
    // Motif merkeze **ve** dört köşeye konmalı; yalnız merkezde duran bir
    // şekil "kareye damgalanmış" görünür, bezeme gibi okunmaz.
    const size = 96;
    for (const name of ['rubElHizb', 'starLattice'] as MotifName[]) {
      const merkezler = motifTile(name, size).paths
        .filter((d) => d.endsWith('Z'))
        .map((d) => {
          const [cx, cy] = merkez(noktalar(d));
          return `${cx.toFixed(1)},${cy.toFixed(1)}`;
        });
      const tekil = new Set(merkezler);
      expect(tekil.has('48.0,48.0')).toBe(true);     // merkez
      expect(tekil.has('0.0,0.0')).toBe(true);        // sol üst köşe
      expect(tekil.has('96.0,96.0')).toBe(true);      // sağ alt köşe
      expect(tekil.size).toBe(5);
    }
  });

  it('mihrap kemeri sivridir, yuvarlak değil', () => {
    // Bir kez yuvarlak çıktı: denetim noktası tepeyle aynı yükseklikteydi,
    // teğet tepede yatay kalıyor ve kemer yarım daireye dönüşüyordu. Denetim
    // noktasının y değeri tepenin **altında** olmalı (SVG'de y aşağı artar).
    const s = 100;
    const kemer = motifTile('arch', s).paths.find((d) => d.includes('Q'));
    expect(kemer).toBeDefined();
    // M baslangic Q denetim tepe Q denetim bitis → nokta dizisi:
    // [0] omuz(sol), [1] sol denetim, [2] tepe, [3] sağ denetim, [4] omuz(sağ).
    const q = noktalar(kemer ?? '');
    expect(q).toHaveLength(5);
    const y = (i: number) => q[i]?.[1] ?? 0;
    expect(y(1)).toBeGreaterThan(y(2));                   // sol denetim tepenin ALTINDA
    expect(y(3)).toBeGreaterThan(y(2));                   // sağ denetim tepenin ALTINDA
    expect(q[2]?.[0] ?? 0).toBeCloseTo(50, 1);            // tepe tam ortada (s=100)
    expect(y(0)).toBeGreaterThan(y(1));                   // omuz denetimin altında
  });

  it('bilinmeyen ada karşı tip güvenliği: liste tam MotifName kümesidir', () => {
    const set: Set<MotifName> = new Set(MOTIF_NAMES);
    expect(set.size).toBe(MOTIF_NAMES.length);
  });
});

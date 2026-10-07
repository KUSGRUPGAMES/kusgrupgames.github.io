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
    // Yıldız tek kapalı yol: 16 köşe, dönüşümlü dış/iç yarıçap. Dış köşeler
    // arasındaki açı tam 45° olmalı. Altı köşeli bir yıldızda 60° çıkar ve
    // sınama yanar — bu bir kez gerçekten oldu (D25).
    const t = motifTile('rubElHizb', 128);
    const on6 = t.paths.map(noktalar).filter((q) => q.length === 16);
    expect(on6.length).toBeGreaterThan(0);

    const pts = on6[0] as Nokta[];
    const [cx, cy] = merkez(pts);
    const yaricap = pts.map(([x, y]) => Math.hypot(x - cx, y - cy));
    const dis = yaricap.filter((_, i) => i % 2 === 0);
    const ic = yaricap.filter((_, i) => i % 2 === 1);
    expect(dis).toHaveLength(8);
    for (const r of dis) expect(r).toBeCloseTo(dis[0] ?? 0, 1);
    for (const r of ic) expect(r).toBeLessThan((dis[0] ?? 0) - 1e-6);

    const acilar = pts
      .filter((_, i) => i % 2 === 0)
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
    // Yıldız karonun merkezine **ve** dört köşesine konmalı; yalnız merkezde
    // duran bir şekil "kareye damgalanmış" görünür, bezeme gibi okunmaz.
    const size = 128;
    for (const name of ['rubElHizb', 'starLattice', 'girih'] as MotifName[]) {
      const merkezler = new Set(
        motifTile(name, size).paths
          .map(noktalar)
          .filter((q) => q.length === 16)
          .map((q) => {
            const [cx, cy] = merkez(q);
            // `toFixed(0)` çok küçük negatif sayıyı "-0" yazıyor ve köşe
            // karşılaştırması tutmuyordu; `Math.round` eksi sıfırı "0" verir.
            return `${Math.round(cx)},${Math.round(cy)}`;
          }),
      );
      for (const beklenen of ['64,64', '0,0', '128,0', '0,128', '128,128']) {
        expect(merkezler.has(beklenen)).toBe(true);
      }
      expect(merkezler.size).toBe(5);
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
    expect(q).toHaveLength(7);
    // [0] taban-sol, [1] omuz-sol, [2] sol denetim, [3] tepe,
    // [4] sağ denetim, [5] omuz-sağ, [6] taban-sağ
    const y = (i: number) => q[i]?.[1] ?? 0;
    expect(y(2)).toBeGreaterThan(y(3));            // sol denetim tepenin ALTINDA
    expect(y(4)).toBeGreaterThan(y(3));            // sağ denetim tepenin ALTINDA
    expect(q[3]?.[0] ?? 0).toBeCloseTo(50, 1);     // tepe tam ortada (s=100)
    expect(y(1)).toBeGreaterThan(y(2));            // omuz denetimin altında
  });

  it('bilinmeyen ada karşı tip güvenliği: liste tam MotifName kümesidir', () => {
    const set: Set<MotifName> = new Set(MOTIF_NAMES);
    expect(set.size).toBe(MOTIF_NAMES.length);
  });
});

import { motifTile, MOTIF_NAMES, type MotifName } from '@/ui/motif/patterns';

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

  it('karo boyutu istenen değerdir ve yollar karo dışına taşmaz', () => {
    const size = 40;
    const tol = 0.05;
    for (const name of MOTIF_NAMES) {
      const t = motifTile(name, size);
      expect(t.size).toBe(size);
      for (const d of t.paths) {
        const nums = (d.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
        for (const n of nums) {
          expect(n).toBeGreaterThanOrEqual(-tol);
          expect(n).toBeLessThanOrEqual(size + tol);
        }
      }
    }
  });

  it('rubElHizb marka paketinin karosunu çiziyor: yıldız + daire', () => {
    const t = motifTile('rubElHizb', 96);
    expect(t.paths).toHaveLength(2);
    // Paketin 96 birimlik karosu birebir: ilk köşe (48,4), daire yarıçapı 25.
    expect(t.paths[0]).toContain('M48.00 4.00');
    // Daire 24 kenarlı çokgenle çizilir; en sağ nokta (48+25, 48).
    expect(t.paths[1]).toContain('73.00,48.00');
  });

  it('bilinmeyen ada karşı tip güvenliği: liste tam MotifName kümesidir', () => {
    const set: Set<MotifName> = new Set(MOTIF_NAMES);
    expect(set.size).toBe(MOTIF_NAMES.length);
  });
});

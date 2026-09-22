import {
  resolve, mergeCollections, visible, pruneTombstones, mergeCounter,
  TOMBSTONE_TTL_MS, type SyncRecord,
} from '@/features/sync/merge';

const kayit = (id: string, updatedAt: number, data: unknown, deleted = false): SyncRecord<unknown> =>
  ({ id, updatedAt, data, ...(deleted ? { deleted: true } : {}) });

describe('çakışma çözümü', () => {
  it('en son yazan kazanır', () => {
    expect(resolve(kayit('a', 2, 'yerel'), kayit('a', 1, 'uzak')).outcome).toBe('local');
    expect(resolve(kayit('a', 1, 'yerel'), kayit('a', 2, 'uzak')).outcome).toBe('remote');
  });

  it('aynı veri ve aynı zamanda çakışma yok', () => {
    expect(resolve(kayit('a', 1, 'x'), kayit('a', 1, 'x')).outcome).toBe('equal');
  });

  it('eşit zaman damgasında karar kararlıdır — iki yön aynı sonucu verir', () => {
    const a = kayit('a', 5, 'alfa');
    const b = kayit('a', 5, 'beta');
    const ileri = resolve(a, b).winner.data;
    const geri = resolve(b, a).winner.data;
    expect(ileri).toBe(geri);
  });
});

describe('koleksiyon birleştirme', () => {
  it('uzakta olan yeni kayıt eklenir', () => {
    const r = mergeCollections([kayit('a', 1, 1)], [kayit('b', 1, 2)]);
    expect(r.merged.map((x) => x.id)).toEqual(['a', 'b']);
    expect(r.report.added).toBe(1);
  });

  it('daha yeni uzak kayıt yereli günceller', () => {
    const r = mergeCollections([kayit('a', 1, 'eski')], [kayit('a', 5, 'yeni')]);
    expect(r.merged[0]?.data).toBe('yeni');
    expect(r.report.updated).toBe(1);
    expect(r.report.conflicts).toBe(1);
  });

  it('daha eski uzak kayıt yereli ezmez', () => {
    const r = mergeCollections([kayit('a', 9, 'yerel')], [kayit('a', 1, 'uzak')]);
    expect(r.merged[0]?.data).toBe('yerel');
    expect(r.report.updated).toBe(0);
  });

  it('silme işareti taşınır — çevrimdışı cihaz silineni diriltmez', () => {
    const r = mergeCollections([kayit('a', 1, 'var')], [kayit('a', 5, 'var', true)]);
    expect(r.merged[0]?.deleted).toBe(true);
    expect(visible(r.merged)).toHaveLength(0);
    expect(r.report.deleted).toBe(1);
  });

  it('silmeden sonra yapılan düzenleme kaydı geri getirir', () => {
    const r = mergeCollections([kayit('a', 9, 'yeniden yazıldı')], [kayit('a', 5, 'x', true)]);
    expect(r.merged[0]?.deleted).toBeUndefined();
    expect(visible(r.merged)).toHaveLength(1);
  });

  it('birleştirme sırası kararlıdır ve iki yön aynı kümeyi verir', () => {
    const yerel = [kayit('b', 3, 1), kayit('a', 1, 2)];
    const uzak = [kayit('c', 2, 3), kayit('a', 5, 9)];
    const ileri = mergeCollections(yerel, uzak).merged;
    const geri = mergeCollections(uzak, yerel).merged;
    expect(ileri.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(geri.map((x) => x.id)).toEqual(['a', 'b', 'c']);
    expect(ileri.map((x) => x.data)).toEqual(geri.map((x) => x.data));
  });

  it('boş taraflarla çökmez', () => {
    expect(mergeCollections([], []).merged).toEqual([]);
    expect(mergeCollections([kayit('a', 1, 1)], []).merged).toHaveLength(1);
    expect(mergeCollections([], [kayit('a', 1, 1)]).merged).toHaveLength(1);
  });

  it('birleştirme idempotenttir — ikinci kez çalıştırmak değiştirmez', () => {
    const bir = mergeCollections([kayit('a', 1, 'x')], [kayit('a', 5, 'y')]).merged;
    const iki = mergeCollections(bir, bir).merged;
    expect(iki).toEqual(bir);
  });
});

describe('mezar taşı temizliği', () => {
  const simdi = 1_000_000_000_000;

  it('süresi dolmuş silme işaretleri atılır', () => {
    const eski = kayit('a', simdi - TOMBSTONE_TTL_MS - 1, 'x', true);
    const yeni = kayit('b', simdi - 1000, 'y', true);
    const canli = kayit('c', simdi - TOMBSTONE_TTL_MS - 1, 'z');
    const kalan = pruneTombstones([eski, yeni, canli], simdi);
    expect(kalan.map((r) => r.id)).toEqual(['b', 'c']);
  });
});

describe('sayaç birleştirme', () => {
  it('iki cihazın azaltmaları birlikte uygulanır', () => {
    // Ortak taban 100. A cihazı 10, B cihazı 5 kaza kılmış.
    expect(mergeCounter({ value: 90, base: 100 }, { value: 95, base: 100 })).toBe(85);
  });

  it('tek taraf değiştiyse o değer geçer', () => {
    expect(mergeCounter({ value: 90, base: 100 }, { value: 100, base: 100 })).toBe(90);
  });

  it('artış ve azalış birlikte toplanır', () => {
    expect(mergeCounter({ value: 130, base: 100 }, { value: 90, base: 100 })).toBe(120);
  });

  it('sonuç eksiye düşmez', () => {
    expect(mergeCounter({ value: 0, base: 10 }, { value: 0, base: 10 })).toBe(0);
  });

  it('taban farklıysa küçük taban alınır, değişimler kaybolmaz', () => {
    expect(mergeCounter({ value: 12, base: 10 }, { value: 7, base: 5 })).toBe(9);
  });
});

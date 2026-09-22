import { dailyIndex, pickDaily, strideFor, dayNumber } from '@/features/daily/pick';

const N = 34;

describe('günün içeriği seçimi', () => {
  it('aynı gün her zaman aynı indisi verir', () => {
    for (let i = 0; i < 5; i++) {
      expect(dailyIndex({ year: 2026, month: 4, day: 12, length: N })).toBe(
        dailyIndex({ year: 2026, month: 4, day: 12, length: N }),
      );
    }
  });

  it('ardışık günler farklı içerik verir', () => {
    const a = dailyIndex({ year: 2026, month: 4, day: 12, length: N });
    const b = dailyIndex({ year: 2026, month: 4, day: 13, length: N });
    expect(a).not.toBe(b);
  });

  it('HERHANGİ N ardışık günde hiçbir madde tekrar etmez', () => {
    // Başlangıç gününü 400 farklı yerden kaydırarak dene: tur sınırı diye
    // bir şey kalmamalı.
    for (let baslangic = 0; baslangic < 400; baslangic += 7) {
      const gorulen = new Set<number>();
      for (let g = 0; g < N; g++) {
        const d = new Date(Date.UTC(2026, 0, 1 + baslangic + g));
        gorulen.add(dailyIndex({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), length: N }));
      }
      expect({ baslangic, adet: gorulen.size }).toEqual({ baslangic, adet: N });
    }
  });

  it('her liste uzunluğu için adım, uzunlukla aralarında asaldır', () => {
    const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
    for (let n = 1; n <= 200; n++) {
      const adim = strideFor(n);
      expect({ n, ok: adim >= 1 && gcd(adim, n) === 1 }).toEqual({ n, ok: true });
    }
  });

  it('bir yılda tüm maddeler kullanılır', () => {
    const gorulen = new Set<number>();
    for (let g = 0; g < 365; g++) {
      const d = new Date(Date.UTC(2026, 0, 1 + g));
      gorulen.add(dailyIndex({ year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), length: N }));
    }
    expect(gorulen.size).toBe(N);
  });

  it('farklı içerik türleri aynı gün farklı indise düşer', () => {
    const dua = dailyIndex({ year: 2026, month: 4, day: 12, length: N, salt: 0 });
    const bilgi = dailyIndex({ year: 2026, month: 4, day: 12, length: N, salt: 101 });
    // Aynı olabilir ama bir yıl boyunca hep aynı olmamalı.
    let ayni = 0;
    for (let g = 0; g < 365; g++) {
      const d = new Date(Date.UTC(2026, 0, 1 + g));
      const p = { year: d.getUTCFullYear(), month: d.getUTCMonth(), day: d.getUTCDate(), length: N };
      if (dailyIndex({ ...p, salt: 0 }) === dailyIndex({ ...p, salt: 101 })) ayni++;
    }
    expect(ayni).toBeLessThan(60);
    expect(typeof dua).toBe('number');
    expect(typeof bilgi).toBe('number');
  });

  it('boş listede çökmez', () => {
    expect(dailyIndex({ year: 2026, month: 0, day: 1, length: 0 })).toBe(-1);
    expect(pickDaily([], { year: 2026, month: 0, day: 1 })).toBeNull();
  });

  it('tek maddelik listede hep aynı madde döner', () => {
    expect(pickDaily(['x'], { year: 2026, month: 0, day: 1 })).toBe('x');
    expect(pickDaily(['x'], { year: 2027, month: 6, day: 9 })).toBe('x');
  });

  it('gün numarası takvim günüyle artar', () => {
    expect(dayNumber(1970, 0, 1)).toBe(0);
    expect(dayNumber(1970, 0, 2)).toBe(1);
    expect(dayNumber(2026, 0, 2) - dayNumber(2026, 0, 1)).toBe(1);
  });
});

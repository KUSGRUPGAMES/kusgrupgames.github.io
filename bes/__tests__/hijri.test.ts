import { toHijri, fromHijri, upcomingReligiousDays, RELIGIOUS_DAYS, HIJRI_MONTHS } from '@/features/hijri/calc';

describe('hicri takvim', () => {
  it('makul aralıkta değer üretir', () => {
    const h = toHijri(new Date(2026, 0, 1));
    expect(h.year).toBeGreaterThan(1440);
    expect(h.year).toBeLessThan(1460);
    expect(h.month).toBeGreaterThanOrEqual(1);
    expect(h.month).toBeLessThanOrEqual(12);
    expect(h.day).toBeGreaterThanOrEqual(1);
    expect(h.day).toBeLessThanOrEqual(30);
    expect(HIJRI_MONTHS).toContain(h.monthName);
  });

  it('ardışık günlerde hicri gün de ilerler', () => {
    const a = toHijri(new Date(2026, 5, 1));
    const b = toHijri(new Date(2026, 5, 2));
    const ileri = b.day === a.day + 1 || (b.day === 1 && b.month !== a.month);
    expect(ileri).toBe(true);
  });

  it('miladi -> hicri -> miladi çevirisi aynı güne döner', () => {
    for (const g of [new Date(2026, 0, 15), new Date(2026, 6, 4), new Date(2027, 2, 9)]) {
      const h = toHijri(g);
      const geri = fromHijri(h.year, h.month, h.day);
      expect(geri).not.toBeNull();
      expect(geri?.getUTCFullYear()).toBe(g.getFullYear());
      expect(geri?.getUTCMonth()).toBe(g.getMonth());
      expect(geri?.getUTCDate()).toBe(g.getDate());
    }
  });
});

describe('dini günler', () => {
  const liste = upcomingReligiousDays(new Date(2026, 5, 21));

  it('tanımlı bütün günler çözülür', () => {
    expect(liste).toHaveLength(RELIGIOUS_DAYS.length);
  });

  it('yakından uzağa sıralıdır ve geçmişte değildir', () => {
    for (let i = 0; i < liste.length; i++) {
      expect(liste[i]!.daysAway).toBeGreaterThanOrEqual(0);
      if (i > 0) expect(liste[i]!.daysAway).toBeGreaterThanOrEqual(liste[i - 1]!.daysAway);
    }
  });

  it('arefe, bayramdan tam bir gün öncedir', () => {
    const arefe = liste.find((x) => x.id === 'eidAdhaEve');
    const bayram = liste.find((x) => x.id === 'eidAdha');
    expect(arefe && bayram).toBeTruthy();
    expect(bayram!.daysAway - arefe!.daysAway).toBe(1);
  });

  it('Regaib kandili perşembeye denk gelir', () => {
    const regaib = liste.find((x) => x.id === 'regaib');
    expect(regaib?.date.getDay()).toBe(4);
  });
});

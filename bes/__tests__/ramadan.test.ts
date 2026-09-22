import {
  ramadanState, ramadanDays, khatmStatus, isFriday, JUZ_TOTAL, RAMADAN_MONTH,
} from '@/features/ramadan/calc';
import { toHijri, fromHijri } from '@/features/hijri/calc';

describe('Ramazan durumu', () => {
  it('Ramazan içindeyken gün numarası verir', () => {
    const bas = fromHijri(1448, RAMADAN_MONTH, 1);
    expect(bas).not.toBeNull();
    const onuncuGun = new Date(bas!.getTime() + 9 * 86400000);
    const r = ramadanState(onuncuGun);
    expect(r.active).toBe(true);
    expect(r.day).toBe(10);
    expect(r.daysUntil).toBe(0);
  });

  it('Ramazan dışındayken kalan gün sayısı pozitiftir', () => {
    const bas = fromHijri(1448, RAMADAN_MONTH, 1);
    const oncesi = new Date(bas!.getTime() - 40 * 86400000);
    const r = ramadanState(oncesi);
    expect(r.active).toBe(false);
    expect(r.daysUntil).toBeGreaterThan(30);
    expect(r.startsOn).not.toBeNull();
  });

  it('Ramazan bittikten sonra gelecek yılın Ramazanına bakar', () => {
    const bas = fromHijri(1448, RAMADAN_MONTH, 1);
    const sonrasi = new Date(bas!.getTime() + 40 * 86400000);
    const r = ramadanState(sonrasi);
    expect(r.active).toBe(false);
    expect(r.startsOn!.getTime()).toBeGreaterThan(sonrasi.getTime());
    // Bir kamerî yıldan uzun olmamalı.
    expect(r.daysUntil).toBeLessThan(360);
  });

  it('gün düzeltmesi tarihi kaydırır', () => {
    const bas = fromHijri(1448, RAMADAN_MONTH, 1);
    const arifeGunu = new Date(bas!.getTime() - 12 * 3600000);
    expect(ramadanState(arifeGunu, 0).active).toBe(false);
    expect(ramadanState(arifeGunu, 1).active).toBe(true);
  });

  it('Ramazan ayı 30 gün listelenir ve hepsi aynı hicrî aydadır', () => {
    const gunler = ramadanDays(1448);
    expect(gunler).toHaveLength(30);
    for (const g of gunler) {
      expect(toHijri(g).month).toBe(RAMADAN_MONTH);
    }
  });
});

describe('mukabele takibi', () => {
  it('tamamlanan cüz sayısı ve oran', () => {
    const s = khatmStatus({ completedJuz: [1, 2, 3], startedOn: '2026-03-01' }, '2026-03-05');
    expect(s.completed).toBe(3);
    expect(s.remaining).toBe(27);
    expect(s.ratio).toBeCloseTo(0.1, 6);
  });

  it('yinelenen ve geçersiz cüz numaraları sayılmaz', () => {
    const s = khatmStatus({ completedJuz: [1, 1, 2, 0, 31, -5], startedOn: '2026-03-01' }, '2026-03-05');
    expect(s.completed).toBe(2);
  });

  it('hedef yoksa tempo hesaplanmaz', () => {
    const s = khatmStatus({ completedJuz: [], startedOn: '2026-03-01' }, '2026-03-05');
    expect(s.dailyPace).toBeNull();
    expect(s.daysLeft).toBeNull();
    expect(s.overdue).toBe(false);
  });

  it('hedefe göre günlük tempo hesaplanır', () => {
    const s = khatmStatus(
      { completedJuz: [1, 2, 3, 4, 5], startedOn: '2026-03-01', targetOn: '2026-03-30' },
      '2026-03-06',
    );
    expect(s.daysLeft).toBe(24);
    expect(s.dailyPace).toBe(1);
  });

  it('gecikince tempo artar ve gecikme bildirilir', () => {
    const s = khatmStatus(
      { completedJuz: [1, 2], startedOn: '2026-03-01', targetOn: '2026-03-05' },
      '2026-03-10',
    );
    expect(s.overdue).toBe(true);
    expect(s.dailyPace).toBe(28);
  });

  it('hatim tamamlanınca gecikme yoktur', () => {
    const hepsi = Array.from({ length: JUZ_TOTAL }, (_, i) => i + 1);
    const s = khatmStatus(
      { completedJuz: hepsi, startedOn: '2026-03-01', targetOn: '2026-03-05' },
      '2026-03-10',
    );
    expect(s.remaining).toBe(0);
    expect(s.overdue).toBe(false);
    expect(s.dailyPace).toBe(0);
  });

  it('bozuk hedef tarihi çökertmez', () => {
    const s = khatmStatus({ completedJuz: [1], startedOn: 'x', targetOn: 'bozuk' }, '2026-03-10');
    expect(s.dailyPace).toBeNull();
  });
});

describe('cuma kipi', () => {
  it('cuma günlerini tanır', () => {
    expect(isFriday(2026, 0, 2)).toBe(true);   // 2 Ocak 2026 cuma
    expect(isFriday(2026, 0, 1)).toBe(false);
    expect(isFriday(2026, 0, 9)).toBe(true);
  });

  it('ay ve yıl sınırında da doğru', () => {
    expect(isFriday(2026, 11, 25)).toBe(true); // 25 Aralık 2026 cuma
  });
});

import { moonState, phaseName, SYNODIC_MONTH } from '@/features/moon/phase';

/** Bilinen yeni ay anları (UTC). Aritmetik model bunlara ±0.5 gün yaklaşmalı. */
const BILINEN_YENI_AY = [
  '2000-01-06T18:14:00Z',
  '2024-01-11T11:57:00Z',
  '2025-01-29T12:36:00Z',
  '2026-01-18T19:52:00Z',
];

describe('ay durumu', () => {
  it('bilinen yeni ay anlarında faz sıfıra yakındır', () => {
    for (const iso of BILINEN_YENI_AY) {
      const m = moonState(new Date(iso));
      const sapmaGun = Math.min(m.phase, 1 - m.phase) * SYNODIC_MONTH;
      expect({ iso, yakin: sapmaGun < 0.5 }).toEqual({ iso, yakin: true });
      expect(m.illumination).toBeLessThan(0.02);
    }
  });

  it('yeni aydan 14.77 gün sonra dolunaydır', () => {
    const yeni = new Date('2025-01-29T12:36:00Z');
    const dolunay = new Date(yeni.getTime() + (SYNODIC_MONTH / 2) * 86400000);
    const m = moonState(dolunay);
    expect(m.illumination).toBeGreaterThan(0.98);
    expect(m.name).toBe('fullMoon');
  });

  it('aydınlanma her zaman 0 ile 1 arasındadır', () => {
    for (let i = 0; i < 60; i++) {
      const m = moonState(new Date(Date.UTC(2026, 0, 1 + i)));
      expect(m.illumination).toBeGreaterThanOrEqual(0);
      expect(m.illumination).toBeLessThanOrEqual(1);
      expect(m.ageDays).toBeGreaterThanOrEqual(0);
      expect(m.ageDays).toBeLessThan(SYNODIC_MONTH);
    }
  });

  it('evre adları döngüyü eksiksiz kapsar', () => {
    const gorulen = new Set<string>();
    for (let i = 0; i < 100; i++) gorulen.add(phaseName(i / 100));
    expect(gorulen.size).toBe(8);
  });

  it('bir sonraki yeni ay ileridedir ve bir kavuşum ayından uzun değildir', () => {
    for (let i = 0; i < 30; i++) {
      const an = new Date(Date.UTC(2026, 2, 1 + i));
      const m = moonState(an);
      const fark = (m.nextNewMoon.getTime() - an.getTime()) / 86400000;
      expect(fark).toBeGreaterThan(0);
      expect(fark).toBeLessThanOrEqual(SYNODIC_MONTH + 0.001);
    }
  });

  it('bir sonraki dolunay ileridedir', () => {
    for (let i = 0; i < 30; i++) {
      const an = new Date(Date.UTC(2026, 6, 1 + i));
      const m = moonState(an);
      expect(m.nextFullMoon.getTime()).toBeGreaterThan(an.getTime());
    }
  });

  it('tarihten bağımsız: cihaz saat dilimi sonucu değiştirmez', () => {
    const an = new Date('2026-05-10T09:00:00Z');
    const beklenen = moonState(an);
    const eski = process.env.TZ;
    try {
      for (const tz of ['UTC', 'Asia/Tokyo', 'America/Los_Angeles']) {
        process.env.TZ = tz;
        expect(moonState(an).phase).toBeCloseTo(beklenen.phase, 10);
      }
    } finally { process.env.TZ = eski; }
  });
});

import { computeRaw, computeTimes, findNext, findCurrent, formatHM, formatCountdown } from '@/features/prayer/calc';
import { METHODS, PRAYER_KEYS, OBLIGATORY_KEYS } from '@/features/prayer/methods';

const ISTANBUL = { lat: 41.0082, lon: 28.9784, tz: 3 };

describe('namaz vakti hesabı', () => {
  it('İstanbul 21 Haziran: astronomik vakitler bilinen değerlere oturur (temkinsiz, MWL = aynı açılar)', () => {
    const t = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz, { method: 'mwl', asrShadow: 1 });
    expect(formatHM(t.fajr)).toBe('03:24');
    expect(formatHM(t.sunrise)).toBe('05:32');
    expect(formatHM(t.dhuhr)).toBe('13:06');
    expect(formatHM(t.asr)).toBe('17:07');
    expect(formatHM(t.maghrib)).toBe('20:40');
    expect(formatHM(t.isha)).toBe('22:38');
  });

  it('vakitler gün içinde artan sırada', () => {
    const t = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz);
    let prev = -1;
    for (const k of PRAYER_KEYS) {
      const v = t[k];
      expect(v).not.toBeNull();
      expect(v as number).toBeGreaterThan(prev);
      prev = v as number;
    }
  });

  it('Hanefî ikindi, Şâfiî ikindiden sonra gelir', () => {
    const shafii = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz, { method: 'diyanet', asrShadow: 1 });
    const hanafi = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz, { method: 'diyanet', asrShadow: 2 });
    expect(hanafi.asr as number).toBeGreaterThan(shafii.asr as number);
  });

  it('ekvatorda ekinoks gündüzü ~12s07dk', () => {
    const t = computeRaw(2026, 2, 20, 0, 0, 0, { method: 'mwl', asrShadow: 1 });
    const daylight = (t.maghrib as number) - (t.sunrise as number);
    expect(daylight).toBeGreaterThan(12.0);
    expect(daylight).toBeLessThan(12.25);
  });

  it('bütün yöntemler orta enlemde altı vakti üretir ve yatsı akşamdan sonradır', () => {
    for (const id of Object.keys(METHODS) as (keyof typeof METHODS)[]) {
      const t = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz, { method: id, asrShadow: 1 });
      for (const k of PRAYER_KEYS) expect(t[k]).not.toBeNull();
      expect(t.isha as number).toBeGreaterThan(t.maghrib as number);
    }
  });

  it('kutup bölgesinde oluşmayan vakit null döner, sayıya zorlanmaz', () => {
    const t = computeRaw(2026, 5, 21, 78.2, 15.6, 1, { method: 'mwl', asrShadow: 1 });
    expect(t.fajr).toBeNull();
    expect(formatHM(t.fajr)).toBe('--:--');
  });

  it('dakika düzeltmesi yalnız ilgili vakti kaydırır', () => {
    const base = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz);
    const tuned = computeTimes(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz,
      { method: 'diyanet', asrShadow: 1, adjustments: { dhuhr: 7 } });
    expect(((tuned.dhuhr as number) - (base.dhuhr as number)) * 60).toBeCloseTo(7, 6);
    expect(tuned.asr).toBeCloseTo(base.asr as number, 10);
  });

  it('güneş namaz vakti sayılmaz', () => {
    expect(OBLIGATORY_KEYS).toHaveLength(5);
    expect(OBLIGATORY_KEYS).not.toContain('sunrise');
  });
});

describe('sıradaki vakit', () => {
  const t = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz);

  it('13:00te sıradaki vakit öğledir', () => {
    const n = findNext(t, null, 13.0);
    expect(n?.key).toBe('dhuhr');
    expect(n?.tomorrow).toBe(false);
  });

  it('gece yarısına yakın saatte yarının imsakını verir', () => {
    const n = findNext(t, 3.4, 23.9);
    expect(n?.key).toBe('fajr');
    expect(n?.tomorrow).toBe(true);
    expect(n?.at).toBeGreaterThan(24);
  });

  it('içinde bulunulan vakti doğru bulur', () => {
    expect(findCurrent(t, 13.0)).toBe('sunrise');
    expect(findCurrent(t, 21.0)).toBe('maghrib');
    expect(findCurrent(t, 1.0)).toBeNull();
  });
});

describe('biçimlendirme', () => {
  it('geri sayım HH:MM:SS', () => {
    expect(formatCountdown(3661)).toBe('01:01:01');
    expect(formatCountdown(-5)).toBe('00:00:00');
  });
  it('24ü aşan saat sarmalanır', () => {
    expect(formatHM(27.5)).toBe('03:30');
  });
});

describe('Diyanet uyumu (5 Ekim)', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const resmi = require('./fixtures/diyanet-2026-10.json') as Record<string, Record<string, string[]>>;
  const YER: Record<string, [number, number]> = { 9206: [39.9334, 32.8597], 9541: [41.0082, 28.9784], 9651: [40.8025, 29.4306] };
  const dk = (s: string) => { const [h, m] = s.split(':').map(Number); return h! * 60 + m!; };
  it('temkinli hesap Diyanet’in ilan ettiği vakitlere en çok 3 dk uzak (internet yokken yedek)', () => {
    let enKotu = 0;
    for (const [id, gunler] of Object.entries(resmi)) {
      const [lat, lon] = YER[id]!;
      for (const [gun, vakit] of Object.entries(gunler)) {
        const [y, m, d] = gun.split('-').map(Number);
        const t = computeTimes(y!, m! - 1, d!, lat, lon, 3, { method: 'diyanet', asrShadow: 1 });
        PRAYER_KEYS.forEach((k, i) => { enKotu = Math.max(enKotu, Math.abs(dk(formatHM(t[k])) - dk(vakit[i]!))); });
      }
    }
    expect(enKotu).toBeLessThanOrEqual(3);
  });
  it('resmî vakit varsa çizelge onu kullanır (kullanıcı düzeltmesi üstüne eklenir)', () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { mergeOfficial } = require('@/features/prayer/official') as typeof import('@/features/prayer/official');
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { daySchedule } = require('@/features/prayer/schedule') as typeof import('@/features/prayer/schedule');
    mergeOfficial('9206', { '2026-10-05': ['05:19', '06:41', '12:42', '15:57', '18:33', '19:50'] }, '2026-10-05');
    const g = daySchedule({ latitude: 39.93, longitude: 32.86, timezone: 'Europe/Istanbul', diyanetId: '9206', options: { method: 'diyanet', asrShadow: 1, adjustments: { maghrib: 2 } } }, 2026, 9, 5);
    expect(formatHM(g.times.maghrib)).toBe('18:35');
    expect(formatHM(g.times.fajr)).toBe('05:19');
    const baska = daySchedule({ latitude: 39.93, longitude: 32.86, timezone: 'Europe/Istanbul', diyanetId: '9206', options: { method: 'mwl', asrShadow: 1 } }, 2026, 9, 5);
    expect(formatHM(baska.times.maghrib)).not.toBe('18:33');
  });
});

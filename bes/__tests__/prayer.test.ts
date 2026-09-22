import { computeRaw, computeTimes, findNext, findCurrent, formatHM, formatCountdown } from '@/features/prayer/calc';
import { METHODS, PRAYER_KEYS, OBLIGATORY_KEYS } from '@/features/prayer/methods';

const ISTANBUL = { lat: 41.0082, lon: 28.9784, tz: 3 };

describe('namaz vakti hesabı', () => {
  it('İstanbul 21 Haziran: vakitler bilinen değerlere oturur', () => {
    const t = computeRaw(2026, 5, 21, ISTANBUL.lat, ISTANBUL.lon, ISTANBUL.tz);
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

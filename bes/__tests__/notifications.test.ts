import { planNotifications, coverageDays, defaultNotificationSettings, PLATFORM_LIMIT } from '@/features/notifications/plan';
import { rangeSchedule, type ScheduleInput } from '@/features/prayer/schedule';

const istanbul: ScheduleInput = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet', asrShadow: 1 },
};
const tromso: ScheduleInput = {
  latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo',
  options: { method: 'mwl', asrShadow: 1 },
};

const gunler = (input: ScheduleInput, y: number, m: number, d: number, n = 14) =>
  rangeSchedule(input, { year: y, month: m, day: d }, n);

describe('bildirim planı', () => {
  const now = new Date('2026-03-15T09:00:00Z'); // İstanbul 12:00

  it('kapalıyken hiçbir bildirim kurulmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), { ...defaultNotificationSettings, enabled: false }, now);
    expect(p).toEqual([]);
  });

  it('geçmiş anlar planlanmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    expect(p.length).toBeGreaterThan(0);
    for (const n of p) expect(n.at.getTime()).toBeGreaterThan(now.getTime());
  });

  it('plan zaman sırasındadır', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    for (let i = 1; i < p.length; i++) {
      expect(p[i]!.at.getTime()).toBeGreaterThanOrEqual(p[i - 1]!.at.getTime());
    }
  });

  it('platform sınırı aşılmaz', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15, 30), defaultNotificationSettings, now);
    expect(p.length).toBeLessThanOrEqual(PLATFORM_LIMIT);
  });

  it('güneş varsayılan olarak bildirilmez', () => {
    const p = planNotifications(gunler(istanbul, 2026, 2, 15), defaultNotificationSettings, now);
    expect(p.some((n) => n.key === 'sunrise')).toBe(false);
  });

  it('kapatılan vakit planlanmaz', () => {
    const p = planNotifications(
      gunler(istanbul, 2026, 2, 15),
      { ...defaultNotificationSettings, perPrayer: { fajr: false } },
      now,
    );
    expect(p.some((n) => n.key === 'fajr')).toBe(false);
    expect(p.some((n) => n.key === 'dhuhr')).toBe(true);
  });

  it('erken uyarı vaktin tam N dakika öncesine kurulur', () => {
    const p = planNotifications(
      gunler(istanbul, 2026, 2, 15),
      { ...defaultNotificationSettings, beforeMinutes: 15 },
      now,
    );
    for (const n of p) {
      expect(n.prayerAt.getTime() - n.at.getTime()).toBe(15 * 60000);
    }
  });

  it('gece yarısını aşan yatsı doğru güne kurulur', () => {
    // Tromsø'da yaz ortasında yatsı gece yarısını aşar; bildirim anı
    // her zaman akşamdan sonra olmalı, aynı günün sabahına düşmemeli.
    const g = gunler(tromso, 2026, 4, 15, 7);
    const p = planNotifications(g, defaultNotificationSettings, new Date('2026-05-15T00:00:00Z'));
    for (const n of p.filter((x) => x.key === 'isha')) {
      const gun = g.find((d) => n.id.includes(`${d.year}${String(d.month + 1).padStart(2, '0')}${String(d.day).padStart(2, '0')}`));
      const aksam = gun?.entries.find((e) => e.key === 'maghrib')?.at;
      if (aksam) expect(n.prayerAt.getTime()).toBeGreaterThan(aksam.getTime());
    }
  });

  it('oluşmayan vakit için bildirim kurulmaz', () => {
    const g = gunler(tromso, 2026, 5, 18, 5);
    const p = planNotifications(g, { ...defaultNotificationSettings, includeSunrise: true }, new Date('2026-06-18T00:00:00Z'));
    expect(p.some((n) => n.key === 'fajr')).toBe(false);
    expect(p.length).toBeGreaterThan(0);
  });

  it('kimlikler tekildir ve aynı girdide aynı kalır', () => {
    const g = gunler(istanbul, 2026, 2, 15);
    const a = planNotifications(g, defaultNotificationSettings, now);
    const b = planNotifications(g, defaultNotificationSettings, now);
    expect(new Set(a.map((n) => n.id)).size).toBe(a.length);
    expect(a.map((n) => n.id)).toEqual(b.map((n) => n.id));
  });

  it('kapsama gün sayısı açık vakit sayısına göre hesaplanır', () => {
    expect(coverageDays(defaultNotificationSettings)).toBe(12);       // 5 vakit
    expect(coverageDays({ ...defaultNotificationSettings, includeSunrise: true })).toBe(10);
    expect(coverageDays({ ...defaultNotificationSettings, perPrayer: { fajr: false, dhuhr: false, asr: false, maghrib: false, isha: false } })).toBe(0);
  });
});

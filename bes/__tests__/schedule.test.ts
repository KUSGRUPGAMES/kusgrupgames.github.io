import { daySchedule, nowView, monthSchedule, rangeSchedule, type ScheduleInput } from '@/features/prayer/schedule';
import { formatHM } from '@/features/prayer/calc';

const istanbul: ScheduleInput = {
  latitude: 41.0082, longitude: 28.9784, timezone: 'Europe/Istanbul',
  options: { method: 'diyanet', asrShadow: 1 },
};

const tromso: ScheduleInput = {
  latitude: 69.6492, longitude: 18.9553, timezone: 'Europe/Oslo',
  options: { method: 'mwl', asrShadow: 1 },
};

describe('gün çizelgesi', () => {
  it('altı vakit üretilir ve sıralıdır', () => {
    const g = daySchedule(istanbul, 2026, 2, 15);
    expect(g.entries).toHaveLength(6);
    const saatler = g.entries.map((e) => e.hours).filter((h): h is number => h !== null);
    for (let i = 1; i < saatler.length; i++) {
      expect(saatler[i]!).toBeGreaterThan(saatler[i - 1]!);
    }
  });

  it('mutlak anlar duvar saatiyle tutarlıdır', () => {
    const g = daySchedule(istanbul, 2026, 5, 21);
    for (const e of g.entries) {
      if (e.hours === null || e.at === null) continue;
      const duvar = new Date(e.at.getTime() + g.offset * 3600000);
      const saat = duvar.getUTCHours() + duvar.getUTCMinutes() / 60;
      expect(Math.abs(saat - e.hours)).toBeLessThan(0.02);
    }
  });

  it('yaz saati geçişinde ofset gün gün doğru alınır', () => {
    // Türkiye 2016'dan beri kalıcı UTC+3; Avrupa hâlâ geçiş yapıyor.
    const kis = daySchedule({ ...istanbul, timezone: 'Europe/Berlin' }, 2026, 0, 15);
    const yaz = daySchedule({ ...istanbul, timezone: 'Europe/Berlin' }, 2026, 6, 15);
    expect(kis.offset).toBe(1);
    expect(yaz.offset).toBe(2);
  });

  it('Türkiye yıl boyu UTC+3', () => {
    for (const ay of [0, 3, 6, 9]) {
      expect(daySchedule(istanbul, 2026, ay, 15).offset).toBe(3);
    }
  });

  it('kutupta oluşmayan vakit null döner, uydurulmaz', () => {
    const haziran = daySchedule(tromso, 2026, 5, 21);
    expect(haziran.times.fajr).toBeNull();
    expect(haziran.entries.find((e) => e.key === 'fajr')?.at).toBeNull();
    // Öğle her zaman vardır.
    expect(haziran.times.dhuhr).not.toBeNull();
  });
});

describe('şu an görünümü', () => {
  it('sıradaki vakit şu andan sonradır', () => {
    const now = new Date('2026-03-15T10:00:00Z'); // İstanbul 13:00
    const v = nowView(istanbul, now);
    expect(v.next).not.toBeNull();
    expect(v.next!.at.getTime()).toBeGreaterThan(now.getTime());
    expect(v.secondsToNext).toBeGreaterThan(0);
  });

  it('cihaz saat dilimi sonucu değiştirmez', () => {
    const now = new Date('2026-03-15T10:00:00Z');
    const beklenen = nowView(istanbul, now);
    const eski = process.env.TZ;
    try {
      for (const tz of ['UTC', 'America/New_York', 'Asia/Tokyo', 'Pacific/Kiritimati']) {
        process.env.TZ = tz;
        const v = nowView(istanbul, now);
        expect(v.next?.key).toBe(beklenen.next?.key);
        expect(v.secondsToNext).toBe(beklenen.secondsToNext);
        expect(v.current).toBe(beklenen.current);
      }
    } finally {
      process.env.TZ = eski;
    }
  });

  it('gece yarısından sonra sıradaki vakit yarının imsakı olabilir', () => {
    // İstanbul 23:30 — yatsı geçmiş, sıradaki yarının imsakı.
    const now = new Date('2026-03-15T20:30:00Z');
    const v = nowView(istanbul, now);
    expect(v.next?.key).toBe('fajr');
    expect(v.next?.tomorrow).toBe(true);
    expect(v.secondsToNext).toBeGreaterThan(0);
    expect(v.secondsToNext).toBeLessThan(12 * 3600);
  });

  it('ilerleme oranı 0 ile 1 arasındadır', () => {
    for (const saat of [0, 4, 8, 12, 16, 20, 23]) {
      const now = new Date(Date.UTC(2026, 4, 10, saat));
      const v = nowView(istanbul, now);
      expect(v.progress).toBeGreaterThanOrEqual(0);
      expect(v.progress).toBeLessThanOrEqual(1);
    }
  });

  it('bilinen değerle karşılaştırma: İstanbul 21 Haziran öğle vakti', () => {
    const g = daySchedule(istanbul, 2026, 5, 21);
    // Yaz gündönümünde İstanbul öğlesi 13:07 civarıdır (güneş geçişi + temkin yok).
    expect(formatHM(g.times.dhuhr)).toMatch(/^13:0[4-9]$/);
  });
});

describe('takvim görünümleri', () => {
  it('ay takvimi gün sayısı kadar satır üretir', () => {
    expect(monthSchedule(istanbul, 2026, 1)).toHaveLength(28);
    expect(monthSchedule(istanbul, 2028, 1)).toHaveLength(29); // artık yıl
    expect(monthSchedule(istanbul, 2026, 0)).toHaveLength(31);
  });

  it('aralık görünümü ay sonunu doğru aşar', () => {
    const r = rangeSchedule(istanbul, { year: 2026, month: 0, day: 30 }, 4);
    expect(r.map((d) => `${d.month}-${d.day}`)).toEqual(['0-30', '0-31', '1-1', '1-2']);
  });
});

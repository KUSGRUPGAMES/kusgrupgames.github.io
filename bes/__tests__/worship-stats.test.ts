import {
  withinDayKeys, summarizePrayers, currentPrayerStreak, dailyPrayerTotals,
  fastingCount, quranMinutesTotal, periodDayKeys, prayerReport, fastReport, fastDebt, quranMinutesIn,
} from '@/features/worship/stats';
import type { WorshipDay, FastDay } from '@/store/worship';

const gun = (over: Partial<WorshipDay['prayers']> = {}, quranMinutes = 0): WorshipDay => ({
  date: '2026-01-01',
  prayers: over,
  quranMinutes,
});

const TAM: WorshipDay['prayers'] = { fajr: 'alone', dhuhr: 'jamaah', asr: 'alone', maghrib: 'jamaah', isha: 'alone' };

describe('ibadet istatistiği', () => {
  it('withinDayKeys yalnız pencere içindeki anahtarları döner', () => {
    const kayitlar = { '2026-01-01': 1, '2026-01-05': 1, '2025-12-20': 1 };
    expect(withinDayKeys(kayitlar, '2026-01-06', 7).sort()).toEqual(['2026-01-01', '2026-01-05']);
  });

  it('summarizePrayers kaza hariç kılınanları sayar, cemaati ayrıca işaretler', () => {
    const days = {
      '2026-01-06': gun(TAM),
      '2026-01-05': gun({ fajr: 'qada', dhuhr: 'alone' }),
    };
    const sonuc = summarizePrayers(days, '2026-01-06', 7);
    // Tam gün: 5 kılınan (2 cemaat) + kısmi gün: 1 kılınan (dhuhr alone), 1 kaza.
    expect(sonuc).toEqual({ days: 7, performed: 6, jamaah: 2, qada: 1, rate: 6 / 35 });
  });

  it('summarizePrayers boş kayıtta sıfır oran döner, bölme hatası vermez', () => {
    expect(summarizePrayers({}, '2026-01-06', 7).rate).toBe(0);
  });

  it('currentPrayerStreak yalnız beş farzın tamamı kılınan ardışık günleri sayar', () => {
    const days = {
      '2026-01-06': gun(TAM),
      '2026-01-05': gun(TAM),
      // 04'te bir vakit eksik — seri burada kesilir.
      '2026-01-04': gun({ fajr: 'alone', dhuhr: 'alone', asr: 'alone', maghrib: 'alone' }),
      '2026-01-03': gun(TAM),
    };
    expect(currentPrayerStreak(days, '2026-01-06')).toBe(2);
  });

  it('kaza ile doldurulmuş bir gün seriyi tam saymaz', () => {
    const days = { '2026-01-06': gun({ ...TAM, isha: 'qada' }) };
    expect(currentPrayerStreak(days, '2026-01-06')).toBe(0);
  });

  it('bugün henüz tam değilse seri kırılmış sayılmaz, dünden bakılır', () => {
    const days = {
      '2026-01-06': gun({ fajr: 'alone' }),
      '2026-01-05': gun(TAM),
    };
    expect(currentPrayerStreak(days, '2026-01-06')).toBe(1);
  });

  it('dailyPrayerTotals eskiden yeniye sıralı, boş günlerde sıfır döner', () => {
    const days = { '2026-01-06': gun(TAM) };
    const sonuc = dailyPrayerTotals(days, '2026-01-06', 3);
    expect(sonuc.map((g) => g.date)).toEqual(['2026-01-04', '2026-01-05', '2026-01-06']);
    expect(sonuc.map((g) => g.completed)).toEqual([0, 0, 5]);
  });

  it('fastingCount pencere içindeki oruç günlerini sayar', () => {
    const fasts: Record<string, FastDay> = {
      '2026-01-06': { date: '2026-01-06', kind: 'nafile', completed: true },
      '2025-01-06': { date: '2025-01-06', kind: 'nafile', completed: true },
    };
    expect(fastingCount(fasts, '2026-01-06', 7)).toBe(1);
  });

  it('quranMinutesTotal pencere içindeki dakikaları toplar', () => {
    const days = {
      '2026-01-06': gun({}, 20),
      '2026-01-05': gun({}, 10),
      '2025-01-01': gun({}, 999),
    };
    expect(quranMinutesTotal(days, '2026-01-06', 7)).toBe(30);
  });
});

describe('dönem raporu', () => {
  it('dönem günleri: hafta 7 gün, ay 1\'inden bugüne, tümü ilk kayıttan', () => {
    expect(periodDayKeys('2026-09-24', 'week')).toHaveLength(7);
    expect(periodDayKeys('2026-09-24', 'month')[0]).toBe('2026-09-01');
    expect(periodDayKeys('2026-09-24', 'month')).toHaveLength(24);
    expect(periodDayKeys('2026-09-24', 'all', ['2026-08-30', '2026-09-10'])).toHaveLength(26);
    expect(periodDayKeys('2026-03-02', 'week')[0]).toBe('2026-02-24');
  });

  it('eksik yalnız kaydı olan günlerden sayılır', () => {
    const days = {
      '2026-09-24': gun({ fajr: 'alone', dhuhr: 'jamaah', asr: 'qada' }, 20),
      '2026-09-23': gun(TAM, 10),
    };
    const r = prayerReport(days, periodDayKeys('2026-09-24', 'week'));
    expect(r.recordedDays).toBe(2);
    expect(r.performed).toBe(7);
    expect(r.qadaMarked).toBe(1);
    expect(r.missed).toBe(2);
    expect(r.perSlot.maghrib).toEqual({ performed: 1, qada: 0, missed: 1 });
    expect(quranMinutesIn(days, periodDayKeys('2026-09-24', 'week'))).toBe(30);
  });

  it('oruç: Ramazan\'da tutulamayan borç olur, kaza orucu borcu düşer', () => {
    const f = (date: string, kind: FastDay['kind'], completed = true): [string, FastDay] => [date, { date, kind, completed }];
    const fasts = Object.fromEntries([
      f('2026-03-01', 'ramadan'), f('2026-03-02', 'ramadan', false), f('2026-03-03', 'ramadan', false),
      f('2026-05-01', 'qada'), f('2026-05-02', 'nafile'),
    ]);
    expect(fastReport(fasts, Object.keys(fasts))).toEqual({ ramadanKept: 1, ramadanMissed: 2, qadaKept: 1, nafile: 1, kaffara: 0 });
    expect(fastDebt(fasts)).toBe(1);
  });
});

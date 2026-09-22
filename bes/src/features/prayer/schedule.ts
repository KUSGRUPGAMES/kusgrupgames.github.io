/**
 * Gün / hafta / ay vakit çizelgesi — şartname §14.
 *
 * Buradaki tek zor mesele **tek zaman çerçevesi**dir: vakitler konumun saat
 * diliminde hesaplanır, "şimdi" cihazdan okunur. İkisi karıştırılırsa geri
 * sayım saatlerce şaşar. Bu yüzden "şimdi" de konumun çerçevesine çevrilir
 * (`zonedNow`) ve mutlak anlar `wallClockToInstant` ile üretilir.
 */
import { zonedNow, offsetForDay, wallClockToInstant } from '@/lib/time/zone';
import { computeTimes, findNext, findCurrent, type PrayerOptions, type PrayerTimes } from './calc';
import { PRAYER_KEYS, type PrayerKey } from './methods';
import type { Coordinates } from '@/features/location/types';

export interface ScheduleInput extends Coordinates {
  /** IANA saat dilimi; null ise cihaz dilimi kullanılır. */
  timezone: string | null;
  options: PrayerOptions;
}

export interface PrayerEntry {
  key: PrayerKey;
  /** Konumun duvar saati, ondalık. */
  hours: number | null;
  /** Mutlak an — bildirim ve geri sayım bununla kurulur. */
  at: Date | null;
}

export interface DaySchedule {
  year: number;
  month: number;
  day: number;
  offset: number;
  times: PrayerTimes;
  entries: PrayerEntry[];
}

/** Belirli bir takvim günü için çizelge. */
export function daySchedule(
  input: ScheduleInput,
  year: number, month: number, day: number,
): DaySchedule {
  const offset = offsetForDay(input.timezone, year, month, day, 0);
  const times = computeTimes(year, month, day, input.latitude, input.longitude, offset, input.options);
  const entries: PrayerEntry[] = PRAYER_KEYS.map((key) => {
    const hours = times[key];
    return {
      key,
      hours,
      at: hours === null ? null : wallClockToInstant(year, month, day, hours, offset),
    };
  });
  return { year, month, day, offset, times, entries };
}

export interface NowView {
  /** Konumun çerçevesindeki bugün. */
  today: DaySchedule;
  tomorrow: DaySchedule;
  /** Şu an içinde bulunulan vakit. */
  current: PrayerKey | null;
  /** Sıradaki vakit. Kutupta oluşmuyorsa null. */
  next: { key: PrayerKey; at: Date; tomorrow: boolean } | null;
  /** Sıradaki vakte kalan saniye. */
  secondsToNext: number;
  /** İçinde bulunulan vaktin ne kadarı geçti (0..1) — halka göstergesi için. */
  progress: number;
}

/**
 * "Şu an" görünümü. `now` dışarıdan verilir; böylece sınamada saat sabitlenir
 * ve geri sayım her cihaz saat diliminde aynı çıkar.
 */
export function nowView(input: ScheduleInput, now: Date = new Date()): NowView {
  const z = zonedNow(input.timezone, now);
  const today = daySchedule(input, z.year, z.month, z.day);
  const yarin = new Date(Date.UTC(z.year, z.month, z.day + 1));
  const tomorrow = daySchedule(input, yarin.getUTCFullYear(), yarin.getUTCMonth(), yarin.getUTCDate());

  const sonraki = findNext(today.times, tomorrow.times.fajr, z.hours);
  const current = findCurrent(today.times, z.hours);

  if (!sonraki) {
    return { today, tomorrow, current, next: null, secondsToNext: 0, progress: 0 };
  }

  const at = sonraki.tomorrow
    ? (tomorrow.entries.find((e) => e.key === sonraki.key)?.at ?? null)
    : (today.entries.find((e) => e.key === sonraki.key)?.at ?? null);

  if (!at) return { today, tomorrow, current, next: null, secondsToNext: 0, progress: 0 };

  const secondsToNext = Math.max(0, Math.round((at.getTime() - now.getTime()) / 1000));

  // İlerleme: bir önceki vakitten bu vakte kadar geçen oran.
  const oncekiSaat = current === null ? null : today.times[current];
  const araSaat = sonraki.at - (oncekiSaat ?? sonraki.at - 1);
  const gecen = z.hours - (oncekiSaat ?? z.hours);
  const progress = araSaat > 0 ? Math.min(1, Math.max(0, gecen / araSaat)) : 0;

  return {
    today,
    tomorrow,
    current,
    next: { key: sonraki.key, at, tomorrow: sonraki.tomorrow },
    secondsToNext,
    progress,
  };
}

/** Ay takvimi: verilen ayın her günü için çizelge (§14). */
export function monthSchedule(input: ScheduleInput, year: number, month: number): DaySchedule[] {
  const gunSayisi = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const out: DaySchedule[] = [];
  for (let d = 1; d <= gunSayisi; d++) out.push(daySchedule(input, year, month, d));
  return out;
}

/** Haftalık görünüm: verilen günden başlayarak N gün. */
export function rangeSchedule(
  input: ScheduleInput,
  start: { year: number; month: number; day: number },
  days: number,
): DaySchedule[] {
  const out: DaySchedule[] = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(Date.UTC(start.year, start.month, start.day + i));
    out.push(daySchedule(input, d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  }
  return out;
}

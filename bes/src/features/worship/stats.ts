/**
 * İbadet defteri istatistiği — şartname §42.
 * Gün sınırı kullanıcının konumunun takvim gününe göre çizilir; `dhikr/stats.ts`
 * ile aynı ilke, aynı yardımcılar (`dateKey`, `parseDateKey`, `daysBetween`).
 */
import { dateKey, parseDateKey, daysBetween } from '@/features/dhikr/stats';
import type { WorshipDay, FastDay } from '@/store/worship';

const FARZ_SLOTS = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const;

export interface PrayerPeriodStats {
  /** İncelenen gün sayısı. */
  days: number;
  /** Kılınan toplam vakit (tek başına + cemaatle) — kaza hariç. */
  performed: number;
  /** Cemaatle kılınan vakit. */
  jamaah: number;
  /** Kaza olarak işaretlenen vakit. */
  qada: number;
  /** performed / (days × 5) — 0 ile 1 arası. */
  rate: number;
}

/** Bir kayıt haritasındaki (gün → herhangi bir değer), son N güne düşen anahtarlar. */
export function withinDayKeys(records: Readonly<Record<string, unknown>>, today: string, days: number): string[] {
  return Object.keys(records).filter((k) => {
    const fark = daysBetween(k, today);
    return fark !== null && fark >= 0 && fark < days;
  });
}

function tamKilindiMi(gun: WorshipDay | undefined): boolean {
  if (!gun) return false;
  return FARZ_SLOTS.every((s) => gun.prayers[s] === 'alone' || gun.prayers[s] === 'jamaah');
}

export function summarizePrayers(
  daysMap: Readonly<Record<string, WorshipDay>>,
  today: string,
  windowDays: number,
): PrayerPeriodStats {
  const keys = withinDayKeys(daysMap, today, windowDays);
  let performed = 0;
  let jamaah = 0;
  let qada = 0;
  for (const k of keys) {
    const gun = daysMap[k];
    if (!gun) continue;
    for (const slot of FARZ_SLOTS) {
      const v = gun.prayers[slot];
      if (v === 'alone' || v === 'jamaah') {
        performed++;
        if (v === 'jamaah') jamaah++;
      } else if (v === 'qada') {
        qada++;
      }
    }
  }
  const olasi = windowDays * FARZ_SLOTS.length;
  return { days: windowDays, performed, jamaah, qada, rate: olasi > 0 ? performed / olasi : 0 };
}

/**
 * Kesintisiz gün serisi: bugünden geriye doğru, beş farzın tamamı (kaza
 * hariç) kılınmış ardışık günler. Bugün henüz tam değilse seri kırılmış
 * sayılmaz; dünden geriye bakılır (`dhikr.currentStreak` ile aynı ilke).
 */
export function currentPrayerStreak(daysMap: Readonly<Record<string, WorshipDay>>, today: string): number {
  const bas = parseDateKey(today);
  if (!bas) return 0;
  const bugunTam = tamKilindiMi(daysMap[today]);
  let seri = 0;
  for (let i = bugunTam ? 0 : 1; i < 400; i++) {
    const d = new Date(Date.UTC(bas.year, bas.month, bas.day - i));
    const k = dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    if (!tamKilindiMi(daysMap[k])) break;
    seri++;
  }
  return seri;
}

/** Günlük tamamlanan farz sayısı (0-5) — grafik için, eskiden yeniye. */
export function dailyPrayerTotals(
  daysMap: Readonly<Record<string, WorshipDay>>,
  today: string,
  windowDays: number,
): { date: string; completed: number }[] {
  const bas = parseDateKey(today);
  if (!bas) return [];
  const out: { date: string; completed: number }[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(bas.year, bas.month, bas.day - i));
    const k = dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    const gun = daysMap[k];
    const completed = gun ? FARZ_SLOTS.filter((s) => gun.prayers[s] === 'alone' || gun.prayers[s] === 'jamaah').length : 0;
    out.push({ date: k, completed });
  }
  return out;
}

export function fastingCount(fasts: Readonly<Record<string, FastDay>>, today: string, windowDays: number): number {
  return withinDayKeys(fasts, today, windowDays).length;
}

export function quranMinutesTotal(
  daysMap: Readonly<Record<string, WorshipDay>>,
  today: string,
  windowDays: number,
): number {
  const keys = withinDayKeys(daysMap, today, windowDays);
  return keys.reduce((sum, k) => sum + (daysMap[k]?.quranMinutes ?? 0), 0);
}

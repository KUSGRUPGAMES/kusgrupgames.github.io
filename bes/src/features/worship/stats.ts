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

// ------------------------------------------------------------ dönem raporu

/** İstatistik dönemi: son 7 gün, bu takvim ayı, ilk kayıttan bugüne. */
export type WorshipPeriod = 'week' | 'month' | 'all';

function gunEkle(key: string, n: number): string {
  const p = parseDateKey(key)!;
  const d = new Date(Date.UTC(p.year, p.month, p.day + n));
  return dateKey(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
}

/**
 * Dönemin bütün günleri (kayıt olsun olmasın), eskiden yeniye, bugün dahil.
 * `all` için başlangıç, verilen kayıtların en eskisidir.
 */
export function periodDayKeys(today: string, period: WorshipPeriod, recordKeys: readonly string[] = []): string[] {
  if (!parseDateKey(today)) return [];
  let bas: string;
  if (period === 'week') bas = gunEkle(today, -6);
  else if (period === 'month') bas = `${today.slice(0, 8)}01`;
  else {
    const gecerli = recordKeys.filter((k) => parseDateKey(k) && k <= today).sort();
    bas = gecerli[0] ?? today;
  }
  const out: string[] = [];
  for (let k = bas; k <= today && out.length < 5000; k = gunEkle(k, 1)) out.push(k);
  return out;
}

type Farz = (typeof FARZ_SLOTS)[number];

export interface PrayerReport {
  /** Dönemdeki gün sayısı. */
  days: number;
  /** Defterde kaydı olan gün. Eksik hesabı yalnız bu günlerden yapılır. */
  recordedDays: number;
  /** Vaktinde kılınan (tek başına + cemaatle). */
  performed: number;
  jamaah: number;
  /** Sonradan kaza olarak kılındı diye işaretlenen. */
  qadaMarked: number;
  /** Kaydı olan günlerde hiç işaretlenmemiş vakit — kılınmamış sayılır. */
  missed: number;
  /** performed / (recordedDays × 5). */
  rate: number;
  perSlot: Record<Farz, { performed: number; qada: number; missed: number }>;
}

export function prayerReport(daysMap: Readonly<Record<string, WorshipDay>>, keys: readonly string[]): PrayerReport {
  const perSlot = Object.fromEntries(FARZ_SLOTS.map((s) => [s, { performed: 0, qada: 0, missed: 0 }])) as PrayerReport['perSlot'];
  let recordedDays = 0; let performed = 0; let jamaah = 0; let qadaMarked = 0; let missed = 0;
  for (const k of keys) {
    const gun = daysMap[k];
    if (!gun) continue;
    recordedDays++;
    for (const slot of FARZ_SLOTS) {
      const v = gun.prayers[slot];
      if (v === 'alone' || v === 'jamaah') {
        performed++; perSlot[slot].performed++;
        if (v === 'jamaah') jamaah++;
      } else if (v === 'qada') {
        qadaMarked++; perSlot[slot].qada++;
      } else {
        missed++; perSlot[slot].missed++;
      }
    }
  }
  const olasi = recordedDays * FARZ_SLOTS.length;
  return {
    days: keys.length, recordedDays, performed, jamaah, qadaMarked, missed,
    rate: olasi > 0 ? performed / olasi : 0, perSlot,
  };
}

export interface FastReport {
  ramadanKept: number;
  /** Ramazan'da tutulamayan (kazaya kalan) gün. */
  ramadanMissed: number;
  qadaKept: number;
  nafile: number;
  kaffara: number;
}

export function fastReport(fasts: Readonly<Record<string, FastDay>>, keys: readonly string[]): FastReport {
  const r: FastReport = { ramadanKept: 0, ramadanMissed: 0, qadaKept: 0, nafile: 0, kaffara: 0 };
  for (const k of keys) {
    const f = fasts[k];
    if (!f) continue;
    if (f.kind === 'ramadan') { if (f.completed) r.ramadanKept++; else r.ramadanMissed++; }
    else if (f.completed && f.kind === 'qada') r.qadaKept++;
    else if (f.completed && f.kind === 'nafile') r.nafile++;
    else if (f.completed && f.kind === 'kaffara') r.kaffara++;
  }
  return r;
}

/**
 * Kalan oruç borcu (bütün kayıtlardan): Ramazan'da tutulamayan günler eksi
 * tutulan kaza orucu. Eksiye düşmez — daha önceki yıllardan kalan borcu
 * defter bilmez; o, kaza ekranındaki sayaçla izlenir.
 */
export function fastDebt(fasts: Readonly<Record<string, FastDay>>): number {
  const r = fastReport(fasts, Object.keys(fasts));
  return Math.max(0, r.ramadanMissed - r.qadaKept);
}

export function quranMinutesIn(daysMap: Readonly<Record<string, WorshipDay>>, keys: readonly string[]): number {
  return keys.reduce((sum, k) => sum + (daysMap[k]?.quranMinutes ?? 0), 0);
}

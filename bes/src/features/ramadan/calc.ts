/**
 * Ramazan, mukabele ve cuma kipi — şartname §47, §48, §50.
 *
 * Tarih kararları **konumun** takvimine göre verilir, cihazın UTC'sine göre
 * değil: kullanıcı Berlin'de ama telefonu UTC'de ise cuma kipi bir gün kayar.
 */
import { toHijri, fromHijri } from '@/features/hijri/calc';

export const RAMADAN_MONTH = 9;
export const JUZ_TOTAL = 30;

export interface RamadanState {
  active: boolean;
  /** Ramazan'ın kaçıncı günü (1–30). Ramazan değilse 0. */
  day: number;
  /** Ramazan başlangıcı (yaklaşık). */
  startsOn: Date | null;
  /** Ramazan'a kaç gün kaldı (başladıysa 0). */
  daysUntil: number;
}

/**
 * Ramazan durumu. `offset`, kullanıcının hicrî gün düzeltmesidir (§44):
 * bölgesel rüyet farkı için tarih bir gün öne/geriye alınabilir.
 */
export function ramadanState(now: Date, offset = 0): RamadanState {
  const duzeltilmis = new Date(now.getTime() + offset * 86400000);
  const h = toHijri(duzeltilmis);

  if (h.month === RAMADAN_MONTH) {
    return {
      active: true,
      day: h.day,
      startsOn: fromHijri(h.year, RAMADAN_MONTH, 1),
      daysUntil: 0,
    };
  }

  // Bu yılın Ramazan'ı geçtiyse gelecek yılınkine bak.
  const buYil = fromHijri(h.year, RAMADAN_MONTH, 1);
  const aday = buYil && buYil.getTime() > duzeltilmis.getTime()
    ? buYil
    : fromHijri(h.year + 1, RAMADAN_MONTH, 1);

  if (!aday) return { active: false, day: 0, startsOn: null, daysUntil: 0 };

  const gun = Math.ceil((aday.getTime() - duzeltilmis.getTime()) / 86400000);
  return { active: false, day: 0, startsOn: aday, daysUntil: Math.max(0, gun) };
}

/** Ramazan'ın 30 gününün miladi karşılıkları (§47). */
export function ramadanDays(hijriYear: number): Date[] {
  const bas = fromHijri(hijriYear, RAMADAN_MONTH, 1);
  if (!bas) return [];
  const out: Date[] = [];
  for (let i = 0; i < 30; i++) {
    out.push(new Date(bas.getTime() + i * 86400000));
  }
  return out;
}

// --------------------------------------------------------------- mukabele

export interface KhatmProgress {
  /** Tamamlanan cüzler (1–30). */
  completedJuz: number[];
  startedOn: string;
  targetOn?: string;
}

export interface KhatmStatus {
  completed: number;
  remaining: number;
  /** 0..1 */
  ratio: number;
  /** Hedefe yetişmek için günde kaç cüz gerekir. Hedef yoksa null. */
  dailyPace: number | null;
  /** Hedefe kalan gün. Hedef yoksa null. */
  daysLeft: number | null;
  /** Hedef geçtiyse true. */
  overdue: boolean;
}

function gunFarki(a: string, b: string): number | null {
  const x = /^(\d{4})-(\d{2})-(\d{2})$/.exec(a);
  const y = /^(\d{4})-(\d{2})-(\d{2})$/.exec(b);
  if (!x || !y) return null;
  return Math.round(
    (Date.UTC(Number(y[1]), Number(y[2]) - 1, Number(y[3]))
      - Date.UTC(Number(x[1]), Number(x[2]) - 1, Number(x[3]))) / 86400000,
  );
}

export function khatmStatus(progress: KhatmProgress, today: string): KhatmStatus {
  const tekil = new Set(progress.completedJuz.filter((j) => j >= 1 && j <= JUZ_TOTAL));
  const completed = tekil.size;
  const remaining = JUZ_TOTAL - completed;

  if (!progress.targetOn) {
    return { completed, remaining, ratio: completed / JUZ_TOTAL, dailyPace: null, daysLeft: null, overdue: false };
  }

  const kalanGun = gunFarki(today, progress.targetOn);
  if (kalanGun === null) {
    return { completed, remaining, ratio: completed / JUZ_TOTAL, dailyPace: null, daysLeft: null, overdue: false };
  }

  const overdue = kalanGun < 0 && remaining > 0;
  // Hedef günü dahil sayılır: bugün bitiyorsa kalan cüzlerin hepsi bugüne düşer.
  const gun = Math.max(1, kalanGun + 1);
  return {
    completed,
    remaining,
    ratio: completed / JUZ_TOTAL,
    dailyPace: remaining === 0 ? 0 : Math.ceil(remaining / gun),
    daysLeft: kalanGun,
    overdue,
  };
}

// ------------------------------------------------------------------ cuma

/**
 * Konumun takvimine göre cuma mı (§50).
 * `weekday` 0=pazar … 5=cuma. Konumun duvar saatinden gelen gün kullanılır.
 */
export function isFriday(year: number, month: number, day: number): boolean {
  return new Date(Date.UTC(year, month, day)).getUTCDay() === 5;
}

/** Kehf suresi — cuma günü okunması yaygın bir gelenektir (§50). */
export const KAHF_SURAH = 18;

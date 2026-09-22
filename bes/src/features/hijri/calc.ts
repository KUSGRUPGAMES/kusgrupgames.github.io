/**
 * Hicrî takvim (§44) ve dini günler (§45).
 *
 * Aritmetik takvimdir: hilâl gözlemine dayanan resmî ilanla **bir gün
 * oynayabilir**. Arayüz bunu her zaman yazar; kesin tarih için kullanıcı
 * bağlı olduğu kurumun takvimine yönlendirilir.
 */
import { julianDay } from '../prayer/astronomy';

export const HIJRI_MONTHS = [
  'Muharrem', 'Safer', 'Rebîülevvel', 'Rebîülâhir', 'Cemâziyelevvel', 'Cemâziyelâhir',
  'Receb', 'Şâban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce',
] as const;

export interface HijriDate {
  day: number;
  /** 1–12. */
  month: number;
  year: number;
  monthName: string;
}

export function toHijri(date: Date): HijriDate {
  const jd = Math.floor(julianDay(date.getFullYear(), date.getMonth() + 1, date.getDate())) + 1;
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j = Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
            Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l = l - Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
      Math.floor(j / 16) * Math.floor((15238 * j) / 43) + 29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { day, month, year, monthName: HIJRI_MONTHS[(month - 1 + 12) % 12] ?? '' };
}

/** Hicrî ay/gün eşleşen ilk miladi tarihi arar (en çok `limit` gün ileri). */
export function nextHijriDate(month: number, day: number, from: Date, limit = 400): Date | null {
  const d = new Date(from.getTime());
  for (let i = 0; i < limit; i++) {
    const h = toHijri(d);
    if (h.month === month && h.day === day) return new Date(d.getTime());
    d.setDate(d.getDate() + 1);
  }
  return null;
}

/**
 * Hicrî tarihten miladiye — çift yönlü çevirici için (§44).
 *
 * Sayısal ters çevirme: hicrî tarihten yaklaşık Jülyen günü kestirilir, sonra
 * o noktanın etrafında taranır. İlk yazımda kestirime AY dahil edilmemişti ve
 * yılın sonuna düşen tarihler (Zilhicce) hiç bulunamıyordu — test yakaladı.
 */
const HIJRI_EPOCH_JD = 1948440;
const HIJRI_YEAR_DAYS = 354.36707;
const HIJRI_MONTH_DAYS = 29.530589;

function jdToDate(jd: number): Date {
  return new Date(Math.round((jd - 2440587.5) * 86400000));
}

export function fromHijri(year: number, month: number, day: number): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 30) return null;
  const approxJd = HIJRI_EPOCH_JD +
    (year - 1) * HIJRI_YEAR_DAYS +
    (month - 1) * HIJRI_MONTH_DAYS +
    (day - 1);
  const start = jdToDate(approxJd);
  const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()));
  // Kestirim en kötü ihtimalle birkaç gün şaşar; ±45 gün fazlasıyla yeter.
  d.setUTCDate(d.getUTCDate() - 45);
  for (let i = 0; i <= 90; i++) {
    const h = toHijri(new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    if (h.year === year && h.month === month && h.day === day) {
      return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  return null;
}

export type ReligiousDayId =
  | 'threeMonths' | 'regaib' | 'miraj' | 'baraat' | 'ramadanStart' | 'qadr'
  | 'eidFitrEve' | 'eidFitr' | 'eidAdhaEve' | 'eidAdha'
  | 'hijriNewYear' | 'ashura' | 'mawlid';

export interface ReligiousDayDef {
  id: ReligiousDayId;
  label: string;
  /** Hicrî [ay, gün]. `rule` verilenlerde kullanılmaz. */
  hijri?: [number, number];
  /** Özel kural: Recep'in ilk perşembesi, ya da bayramdan bir gün önce. */
  rule?: 'firstThursdayOfRajab' | { eveOf: [number, number] };
}

export const RELIGIOUS_DAYS: readonly ReligiousDayDef[] = [
  { id: 'threeMonths', label: 'Üç Ayların Başlangıcı', hijri: [7, 1] },
  { id: 'regaib', label: 'Regaib Kandili', rule: 'firstThursdayOfRajab' },
  { id: 'miraj', label: 'Miraç Kandili', hijri: [7, 27] },
  { id: 'baraat', label: 'Berat Kandili', hijri: [8, 15] },
  { id: 'ramadanStart', label: 'Ramazan Başlangıcı', hijri: [9, 1] },
  { id: 'qadr', label: 'Kadir Gecesi', hijri: [9, 27] },
  { id: 'eidFitrEve', label: 'Ramazan Bayramı Arefe', rule: { eveOf: [10, 1] } },
  { id: 'eidFitr', label: 'Ramazan Bayramı', hijri: [10, 1] },
  { id: 'eidAdhaEve', label: 'Kurban Bayramı Arefe', rule: { eveOf: [12, 10] } },
  { id: 'eidAdha', label: 'Kurban Bayramı', hijri: [12, 10] },
  { id: 'hijriNewYear', label: 'Hicri Yılbaşı', hijri: [1, 1] },
  { id: 'ashura', label: 'Aşure Günü', hijri: [1, 10] },
  { id: 'mawlid', label: 'Mevlid Kandili', hijri: [3, 12] },
] as const;

export interface UpcomingDay {
  id: ReligiousDayId;
  label: string;
  date: Date;
  /** Bugünden kaç gün sonra (0 = bugün). */
  daysAway: number;
}

function startOfDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function resolveReligiousDay(def: ReligiousDayDef, from: Date): Date | null {
  if (def.rule === 'firstThursdayOfRajab') {
    const rajab = nextHijriDate(7, 1, from);
    if (!rajab) return null;
    const d = new Date(rajab.getTime());
    for (let i = 0; i < 10; i++) {
      if (d.getDay() === 4) return d;
      d.setDate(d.getDate() + 1);
    }
    return null;
  }
  if (def.rule && typeof def.rule === 'object') {
    const [m, dd] = def.rule.eveOf;
    const eid = nextHijriDate(m, dd, from);
    if (!eid) return null;
    const eve = new Date(eid.getTime());
    eve.setDate(eve.getDate() - 1);
    return eve;
  }
  if (!def.hijri) return null;
  return nextHijriDate(def.hijri[0], def.hijri[1], from);
}

/** Yaklaşan dini günler, yakından uzağa sıralı (§45). */
export function upcomingReligiousDays(from: Date = new Date()): UpcomingDay[] {
  const base = startOfDay(from);
  const out: UpcomingDay[] = [];
  for (const def of RELIGIOUS_DAYS) {
    const date = resolveReligiousDay(def, base);
    if (!date) continue;
    out.push({
      id: def.id,
      label: def.label,
      date,
      daysAway: Math.round((startOfDay(date).getTime() - base.getTime()) / 86400000),
    });
  }
  return out.sort((a, b) => a.daysAway - b.daysAway);
}

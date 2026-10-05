/**
 * Oruç bildirimleri — saf plan (5 Ekim kararı).
 *
 * Vakit bildirimleri artık oruçtan söz etmez: Ramazan dışında "yeme içme
 * sona erdi / iftar vakti" demek yanıltıcıydı. Oruç bildirimleri kullanıcı
 * açarsa kurulur:
 *  - 'ramadan'  : yalnız Ramazan günlerinde,
 *  - 'planned'  : İbadet → Oruç'ta o gün için oruç kaydı varsa (nafile/kaza),
 *  - 'everyday' : her gün.
 * Oruç günü için: sahur hatırlatması (imsaka X dk kala), imsak (yeme içme
 * biter) ve iftar (akşam vakti). Zamanlar vakit çizelgesinden gelir; Diyanet
 * kaynaklıysa Diyanet'in imsak/akşam vakti kullanılır.
 */
import type { DaySchedule } from '@/features/prayer/schedule';

export type FastingMode = 'off' | 'ramadan' | 'planned' | 'everyday';

export interface FastingSettings {
  mode: FastingMode;
  /** İmsaktan kaç dakika önce sahur hatırlatması (0 = yok). */
  sahurMinutes: number;
  /** İmsak anında "yeme içme sona erdi" bildirimi. */
  atImsak: boolean;
  /** Akşam vaktinde iftar bildirimi. */
  iftar: boolean;
}

export const defaultFastingSettings: FastingSettings = { mode: 'off', sahurMinutes: 45, atImsak: true, iftar: true };

export type FastingEvent = 'sahur' | 'imsak' | 'iftar';

export interface PlannedFasting {
  id: string;
  event: FastingEvent;
  at: Date;
  /** Sahur için imsaka kalan dakika. */
  minutes: number;
}

export const dayKey = (d: Pick<DaySchedule, 'year' | 'month' | 'day'>) =>
  `${d.year}-${String(d.month + 1).padStart(2, '0')}-${String(d.day).padStart(2, '0')}`;

/**
 * @param isRamadan Gün Ramazan'da mı (hicrî takvim, kullanıcı düzeltmesiyle).
 * @param plannedDates İbadet → Oruç'taki kayıtlı günler ('YYYY-MM-DD').
 */
export function planFasting(
  days: readonly DaySchedule[],
  s: FastingSettings,
  isRamadan: (d: DaySchedule) => boolean,
  plannedDates: ReadonlySet<string>,
  now: Date = new Date(),
): PlannedFasting[] {
  if (s.mode === 'off') return [];
  const out: PlannedFasting[] = [];
  for (const d of days) {
    const oruc = s.mode === 'everyday' || (s.mode === 'ramadan' && isRamadan(d)) || (s.mode === 'planned' && plannedDates.has(dayKey(d)));
    if (!oruc) continue;
    const imsak = d.entries.find((e) => e.key === 'fajr')?.at;
    const aksam = d.entries.find((e) => e.key === 'maghrib')?.at;
    const k = dayKey(d).replace(/-/g, '');
    if (imsak && s.sahurMinutes > 0) {
      const at = new Date(imsak.getTime() - s.sahurMinutes * 60000);
      if (at > now) out.push({ id: `reminder-oruc-${k}-sahur`, event: 'sahur', at, minutes: s.sahurMinutes });
    }
    if (imsak && s.atImsak && imsak > now) out.push({ id: `reminder-oruc-${k}-imsak`, event: 'imsak', at: imsak, minutes: 0 });
    if (aksam && s.iftar && aksam > now) out.push({ id: `reminder-oruc-${k}-iftar`, event: 'iftar', at: aksam, minutes: 0 });
  }
  return out;
}

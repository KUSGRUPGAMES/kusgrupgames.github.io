/**
 * Özel hatırlatıcılar — şartname §64.
 *
 * İki tür: sabit saatte ("her gün 21:00") ve vakte göre ("akşamdan 30 dk
 * önce"). Vakte göre olanlar, vakitler her gün değiştiği için **her
 * planlamada yeniden hesaplanır**; sabit saatliler haftanın seçili günlerinde
 * tekrar eder.
 */
import type { DaySchedule } from '@/features/prayer/schedule';
import type { PrayerKey } from '@/features/prayer/methods';
import { wallClockToInstant } from '@/lib/time/zone';

export type ReminderTrigger =
  | { kind: 'time'; hour: number; minute: number }
  | { kind: 'prayer'; slot: PrayerKey; offsetMinutes: number };

export interface Reminder {
  id: string;
  title: string;
  body?: string;
  trigger: ReminderTrigger;
  /** 0 = pazar … 6 = cumartesi. Boş dizi = her gün. */
  weekdays: number[];
  enabled: boolean;
}

export interface PlannedReminder {
  /** Bildirim kimliği: hatırlatıcı + gün. */
  id: string;
  reminderId: string;
  title: string;
  body: string;
  at: Date;
}

function weekdayOf(day: DaySchedule): number {
  return new Date(Date.UTC(day.year, day.month, day.day)).getUTCDay();
}

export function describeTrigger(trigger: ReminderTrigger): string {
  if (trigger.kind === 'time') {
    return `${String(trigger.hour).padStart(2, '0')}:${String(trigger.minute).padStart(2, '0')}`;
  }
  const d = trigger.offsetMinutes;
  return d === 0 ? trigger.slot : `${trigger.slot} ${d > 0 ? '+' : ''}${d}`;
}

/**
 * Hatırlatıcıları verilen günler için planlar.
 * Geçmiş anlar atlanır; kapalı hatırlatıcılar hiç işlenmez.
 */
export function planReminders(
  reminders: readonly Reminder[],
  days: readonly DaySchedule[],
  now: Date = new Date(),
  limit = 64,
): PlannedReminder[] {
  const out: PlannedReminder[] = [];

  for (const day of days) {
    const gun = weekdayOf(day);
    for (const r of reminders) {
      if (!r.enabled) continue;
      if (r.weekdays.length > 0 && !r.weekdays.includes(gun)) continue;

      let at: Date | null = null;
      // Tetikleyici yerel bir değişkene alınır: geri çağrı içinde tip daralması
      // korunmaz, `r.trigger.slot` orada görünmez olur.
      const tetik = r.trigger;

      if (tetik.kind === 'time') {
        const saat = tetik.hour + tetik.minute / 60;
        at = wallClockToInstant(day.year, day.month, day.day, saat, day.offset);
      } else {
        const entry = day.entries.find((e) => e.key === tetik.slot);
        // Kutupta oluşmayan vakte bağlı hatırlatıcı kurulmaz.
        if (entry?.at) at = new Date(entry.at.getTime() + tetik.offsetMinutes * 60000);
      }

      if (!at || at.getTime() <= now.getTime()) continue;

      const ay = String(day.month + 1).padStart(2, '0');
      const gg = String(day.day).padStart(2, '0');
      out.push({
        id: `reminder-${r.id}-${day.year}${ay}${gg}`,
        reminderId: r.id,
        title: r.title,
        body: r.body ?? '',
        at,
      });
    }
  }

  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out.slice(0, Math.max(0, limit));
}
